const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

export const taskApi = {
  list: () => request("/tasks"),
  create: (task) => request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  update: (id, task) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(task) }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
