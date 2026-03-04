import api from './axios';

export const uploadFile = (jobId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('jobId', jobId);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
};
