import api from "./axios";

// Patient (own record)
export const getMyRecords = async () => (await api.get("/records/me")).data;
export const updateMyProfile = async (profile) =>
  (await api.put("/records/me/profile", profile)).data;

// Admin (any patient)
export const getPatientRecord = async (userId) =>
  (await api.get(`/records/patients/${userId}`)).data;
export const updatePatientProfile = async (userId, profile) =>
  (await api.put(`/records/patients/${userId}/profile`, profile)).data;
export const saveClinicalNote = async (appointmentId, note) =>
  (await api.put(`/records/appointments/${appointmentId}/note`, note)).data;
