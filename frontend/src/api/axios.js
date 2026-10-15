import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Bago ipadala ang bawat request, awtomatikong idadagdag ang JWT token
// (kung naka-login) sa Authorization header.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Kapag expired o invalid na ang token (401), burahin ang session at balik sa login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isLoginRequest) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
