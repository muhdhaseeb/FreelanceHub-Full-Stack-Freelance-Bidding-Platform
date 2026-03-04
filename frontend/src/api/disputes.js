import api from "./axios";
export const raiseDispute = (jobId, data) => api.post(`/disputes/${jobId}`, data);
export const getDispute   = (jobId)       => api.get(`/disputes/${jobId}`);
