import { request } from "./apiClient";

export async function fetchNotifications() {
  return request("/notifications/");
}
