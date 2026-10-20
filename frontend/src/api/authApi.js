import api from "./axios";

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await api.post("/auth/verify-otp", { email, otp });
  return response.data;
};

export const resendOTP = async (email) => {
  const response = await api.post("/auth/resend-otp", { email });
  return response.data;
};

// Forgot password: 1) ask for a code by email, 2) send the code with the new password
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ email, code, password }) => {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    password,
  });
  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
