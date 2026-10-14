import api from "./axios";

export const getClosedDates = async () => (await api.get("/closed-dates")).data;
export const addClosedDate = async (payload) =>
  (await api.post("/closed-dates", payload)).data;
export const deleteClosedDate = async (id) =>
  (await api.delete(`/closed-dates/${id}`)).data;
