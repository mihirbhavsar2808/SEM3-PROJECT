import { request } from "./apiClient";

export async function fetchAttendance(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/attendance/${query ? "?" + query : ""}`);
}

export async function updateAttendanceStatus(id, status) {
  return request(`/attendance/${id}/mark_status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function bulkMarkAttendance(status, date) {
  return request("/attendance/bulk_mark/", {
    method: "POST",
    body: JSON.stringify({ status, date }),
  });
}
