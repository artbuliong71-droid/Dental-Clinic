import api from "./axios";

export const getStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export const getAllAppointments = async () => {
  const response = await api.get("/appointments");
  return response.data;
};

export const updateAppointmentStatus = async (id, status) => {
  const response = await api.patch(`/appointments/${id}/status`, { status });
  return response.data;
};

// Staff accounts (admin only)
export const getStaffList = async () => {
  const response = await api.get("/admin/staff");
  return response.data;
};

export const createStaff = async (staffData) => {
  const response = await api.post("/admin/staff", staffData);
  return response.data;
};
