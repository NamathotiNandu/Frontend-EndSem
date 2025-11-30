const calculateProjectProgress = (project, tasks) => {
  if (!project && !tasks) return 0;

  const milestoneCount = project?.milestones?.length || 0;
  const completedMilestones = project?.milestones?.filter(m => m.completed).length || 0;

  const taskCount = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;

  const milestoneWeight = 0.5;
  const taskWeight = 0.5;

  const milestoneProgress = milestoneCount ? (completedMilestones / milestoneCount) : 0;
  const taskProgress = taskCount ? (completedTasks / taskCount) : 0;

  const totalProgress = (milestoneProgress * milestoneWeight + taskProgress * taskWeight) * 100;
  return Math.round(totalProgress);
};

module.exports = calculateProjectProgress;
