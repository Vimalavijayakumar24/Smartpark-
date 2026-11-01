/*
 * SmartPark API helper.
 *
 * The backend will run on port 5000 during local development.
 * Change API_BASE_URL if your friend uses a different address.
 *
 * Never put database passwords or private secrets in frontend files.
 */

const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,

    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),

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
