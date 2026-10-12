import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Bago ipadala ang bawat request, awtomatikong idadagdag ang JWT token
// (kung naka-login) sa Authorization header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
