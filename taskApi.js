import axiosClient from './axiosClient';

export const fetchTasksByProject = (projectId) =>
  axiosClient.get(`/tasks/project/${projectId}`);

export const createTask = (data) => axiosClient.post('/tasks', data);
export const updateTask = (id, data) => axiosClient.put(`/tasks/${id}`, data);
export const deleteTask = (id) => axiosClient.delete(`/tasks/${id}`);
