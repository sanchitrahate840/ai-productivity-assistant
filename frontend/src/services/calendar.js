const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

export const calendarApi = {
  events: () => request("/calendar/events"),
  createEvent: (event) => request("/calendar/events", { method: "POST", body: JSON.stringify(event) }),
  reminders: () => request("/calendar/reminders"),
  createReminder: (reminder) => request("/calendar/reminders", { method: "POST", body: JSON.stringify(reminder) }),
  completeReminder: (id, isCompleted) => request(`/calendar/reminders/${id}`, { method: "PATCH", body: JSON.stringify({ isCompleted }) }),
  deleteReminder: (id) => request(`/calendar/reminders/${id}`, { method: "DELETE" }),
};
