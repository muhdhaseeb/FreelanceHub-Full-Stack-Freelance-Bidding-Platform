import api from "./axios";
export const getAllDisputes  = (params) => api.get("/admin/disputes", { params });
export const resolveDispute = (id, data) => api.patch(`/admin/disputes/${id}/resolve`, data);
