/*
 * SmartPark API client
 * Connects frontend to Express backend on port 5000
 */

const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("smartpark_token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "The request could not be completed.";

    throw new Error(message);
  }

  return data;
}

function isBackendConfigured() {
  return Boolean(API_BASE_URL && !API_BASE_URL.includes("YOUR_BACKEND"));
}
