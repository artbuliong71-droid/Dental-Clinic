import api from "./axios";

export const getNotifications = async () =>
  (await api.get("/notifications")).data;
export const markNotificationRead = async (id) =>
  (await api.patch(`/notifications/${id}/read`)).data;
export const markAllNotificationsRead = async () =>
  (await api.patch("/notifications/read-all")).data;
