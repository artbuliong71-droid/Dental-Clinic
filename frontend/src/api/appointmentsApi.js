import api from "./axios";

export const bookAppointment = async (appointmentData) => {
  const response = await api.post("/appointments", appointmentData);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get("/appointments/my");
  return response.data;
};

export const cancelAppointment = async (id) => {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
};
