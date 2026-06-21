import { authStorage } from "../lib/auth.js";
import { API_BASE_URL } from "../lib/config.js";

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseError(response, fallback = "Yêu cầu thất bại") {
  const errorData = await response.json().catch(() => null);
  const error = new Error(errorData?.detail || response.statusText || fallback);
  error.status = response.status;
  return error;
}

function getAuthHeaders() {
  const token = authStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiJson(path, { method = "GET", headers = {}, body, fallbackError } = {}) {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...getAuthHeaders(),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response, fallbackError);
  }

  return response.json().catch(() => null);
}

export async function apiBlob(path, { headers = {}, fallbackError } = {}) {
  const response = await fetch(buildUrl(path), { headers: { ...getAuthHeaders(), ...headers } });

  if (!response.ok) {
    throw await parseError(response, fallbackError);
  }

  return response.blob();
}
