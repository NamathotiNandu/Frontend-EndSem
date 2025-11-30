import axiosClient from './axiosClient';

export const fetchActivityByProject = (projectId) =>
  axiosClient.get(`/activity/project/${projectId}`);
