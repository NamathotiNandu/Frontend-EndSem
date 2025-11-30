const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Get all activities for a project
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id ||
      project.members.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view activities for this project'
      });
    }

    const activities = await Activity.find({ project: projectId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
