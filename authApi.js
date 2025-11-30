import axiosClient from './axiosClient';

export const login = (data) => axiosClient.post('/auth/login', data);
export const register = (data) => axiosClient.post('/auth/register', data);
export const getProfile = () => axiosClient.get('/auth/me');
