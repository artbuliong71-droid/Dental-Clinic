import api from "./axios";

export const getDentists = async () => {
  const response = await api.get("/dentists");
  return response.data;
};
