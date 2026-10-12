import api from "./axios";

export const getServices = async () => {
  const response = await api.get("/services");
  return response.data;
};
export const createService = async (serviceData) => {
  const response = await api.post("/services", serviceData);
  return response.data;
};
