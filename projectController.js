const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'student') {
      query.members = req.user.id;
    } else if (req.user.role === 'faculty') {
      query.faculty = req.user.id;
    }

    const projects = await Project.find(query)
      .populate('faculty', 'name email')
      .populate('members', 'name email studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('members', 'name email studentId department year')
      .populate('files.uploadedBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const hasAccess = req.user.role === 'admin' ||
      project.faculty._id.toString() === req.user.id ||
      project.members.some(m => m._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Faculty/Admin
exports.createProject = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot create projects'
      });
    }

    const project = await Project.create({
      ...req.body,
      faculty: req.user.role === 'faculty' ? req.user.id : req.body.faculty || req.user.id
    });

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'project-updated',
      description: `Project "${project.title}" was created`
    });

    const populatedProject = await Project.findById(project._id)
      .populate('faculty', 'name email')
      .populate('members', 'name email studentId');

    res.status(201).json({
      success: true,
      project: populatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    const isAuthorized = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id ||
      (req.user.role === 'student' && project.members.includes(req.user.id));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('faculty', 'name email')
      .populate('members', 'name email studentId');

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'project-updated',
      description: `Project "${project.title}" was updated`
    });

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Faculty/Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && project.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    // Delete related tasks and activities
    await Task.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && project.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members'
      });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (project.members.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Member already in project'
      });
    }

    project.members.push(memberId);
    member.groups.push(project._id);
    await project.save();
    await member.save();

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'member-added',
      description: `${member.name} was added to the project`,
      metadata: { memberId: member._id, memberName: member.name }
    });

    const populatedProject = await Project.findById(project._id)
      .populate('faculty', 'name email')
      .populate('members', 'name email studentId');

    res.status(200).json({
      success: true,
      project: populatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && project.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members'
      });
    }

    project.members = project.members.filter(
      m => m.toString() !== req.params.memberId
    );

    const member = await User.findById(req.params.memberId);
    if (member) {
      member.groups = member.groups.filter(
        g => g.toString() !== project._id.toString()
      );
      await member.save();
    }

    await project.save();

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update project progress
// @route   PUT /api/projects/:id/progress
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate progress from tasks
    const tasks = await Task.find({ project: project._id });
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      project.progress = Math.round((completedTasks / tasks.length) * 100);
    } else {
      project.progress = progress || 0;
    }

    await project.save();

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
