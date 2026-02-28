import api from './axios';
export const getBidsForJob = (jobId) => api.get('/bids', { params: { jobId } });
export const getMyBids = () => api.get('/bids/my');
export const submitBid = (data) => api.post('/bids', data);
export const acceptBid = (bidId) => api.patch(`/bids/${bidId}/accept`);
export const rejectBid = (bidId) => api.patch(`/bids/${bidId}/reject`);
export const cancelContract = (jobId, reason) => api.post(`/bids/cancel/${jobId}`, { reason });
