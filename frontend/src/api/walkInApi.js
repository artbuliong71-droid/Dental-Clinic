import api from "./axios";

export const searchWalkInPatients = async (q) =>
  (await api.get("/walk-in/patients", { params: { q } })).data;

export const createWalkInAppointment = async (payload) =>
  (await api.post("/walk-in/appointments", payload)).data;
export const registerWalkInPatient = async (payload) =>
  (await api.post("/walk-in/patients", payload)).data;
