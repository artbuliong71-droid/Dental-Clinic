import api from "./axios";

export const bookAppointment = async (appointmentData) => {
  const response = await api.post("/appointments", appointmentData);
  return response.data;
};
export const getAvailableSlots = async (dentist, date) => {
  const response = await api.get("/appointments/slots", {
    params: { dentist, date },
  });
  return response.data;
};
export const getMyAppointments = async () => {
  const response = await api.get("/appointments/my");
  return response.data;
};

// A reason is required. DELETE needs the body inside `data`.
export const cancelAppointment = async (id, cancellationReason) => {
  const response = await api.delete(`/appointments/${id}`, {
    data: { cancellationReason },
  });
  return response.data;
};

// payload: { appointmentDate, appointmentTime, service?, rescheduleReason }
export const rescheduleAppointment = async (id, payload) => {
  const response = await api.patch(`/appointments/${id}/reschedule`, payload);
  return response.data;
};
