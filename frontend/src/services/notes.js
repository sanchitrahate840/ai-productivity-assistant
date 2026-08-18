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

export const noteApi = {
  list: (search = "") => request(`/notes?search=${encodeURIComponent(search)}`),
  create: (note) => request("/notes", { method: "POST", body: JSON.stringify(note) }),
  update: (id, note) => request(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(note) }),
  remove: (id) => request(`/notes/${id}`, { method: "DELETE" }),
};
