const Submission = require('../models/Submission');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const fs = require('fs');
const path = require('path');

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Private
exports.getSubmissions = async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = {};

    if (projectId) {
      query.project = projectId;
    }

    // Filter by role
    if (req.user.role === 'student') {
      query.submittedBy = req.user.id;
    } else if (req.user.role === 'faculty') {
      const projects = await Project.find({ faculty: req.user.id });
      query.project = { $in: projects.map(p => p._id) };
    }

    const submissions = await Submission.find(query)
      .populate('project', 'title')
      .populate('submittedBy', 'name email studentId')
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('project', 'title faculty members')
      .populate('submittedBy', 'name email studentId')
      .populate('reviewedBy', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check access
    const project = submission.project;
    const hasAccess = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id ||
      submission.submittedBy._id.toString() === req.user.id ||
      project.members.some(m => m.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this submission'
      });
    }

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
exports.createSubmission = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is a member
    if (req.user.role === 'student' && !project.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project'
      });
    }

    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `uploads/submissions/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    const submission = await Submission.create({
      project: req.body.project,
      submittedBy: req.user.id,
      files,
      comments: req.body.comments
    });

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'submission-created',
      description: `New submission was created for project "${project.title}"`,
      metadata: { submissionId: submission._id }
    });

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('project', 'title')
      .populate('submittedBy', 'name email');

    res.status(201).json({
      success: true,
      submission: populatedSubmission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update submission (review/feedback)
// @route   PUT /api/submissions/:id
// @access  Private/Faculty/Admin
exports.updateSubmission = async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id).populate('project');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check authorization (only faculty/admin can review)
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot review submissions'
      });
    }

    const project = submission.project;
    const isAuthorized = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this submission'
      });
    }

    submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        reviewedBy: req.user.id,
        reviewedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
      .populate('project', 'title')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'feedback-added',
      description: `Feedback was added to submission`,
      metadata: {
        submissionId: submission._id,
        status: submission.status,
        grade: submission.grade
      }
    });

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('project');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check authorization
    const isAuthorized = req.user.role === 'admin' ||
      submission.submittedBy.toString() === req.user.id ||
      submission.project.faculty.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this submission'
      });
    }

    // Delete files
    submission.files.forEach(file => {
      const filePath = path.join(__dirname, '..', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await submission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

