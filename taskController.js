const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// @desc    Get all tasks for a project
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = {};

    if (projectId) {
      query.project = projectId;
    }

    // If student, only show tasks assigned to them or in their projects
    if (req.user.role === 'student') {
      const userProjects = await Project.find({ members: req.user.id });
      const projectIds = userProjects.map(p => p._id);
      query.$or = [
        { assignedTo: req.user.id },
        { project: { $in: projectIds } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title members faculty')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    const isAuthorized = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id ||
      project.members.includes(req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks for this project'
      });
    }

    const task = await Task.create(req.body);

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: 'task-created',
      description: `Task "${task.title}" was created`,
      metadata: { taskId: task._id, taskTitle: task.title }
    });

    // Update project progress
    const tasks = await Task.find({ project: project._id });
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    project.progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    await project.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization
    const project = task.project;
    const isAuthorized = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id ||
      project.members.includes(req.user.id) ||
      task.assignedTo?.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('project', 'title')
      .populate('assignedTo', 'name email');

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user.id,
      type: req.body.status === 'done' ? 'task-completed' : 'task-updated',
      description: `Task "${task.title}" was ${req.body.status === 'done' ? 'completed' : 'updated'}`,
      metadata: { taskId: task._id, taskTitle: task.title, status: task.status }
    });

    // Update project progress
    const tasks = await Task.find({ project: project._id });
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    project.progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    await project.save();

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization
    const project = task.project;
    const isAuthorized = req.user.role === 'admin' ||
      project.faculty.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await task.deleteOne();

    // Update project progress
    const tasks = await Task.find({ project: project._id });
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    project.progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
