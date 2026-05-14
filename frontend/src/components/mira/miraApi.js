/**
 * miraApi.js — low-level API wrappers for MIRA.
 *
 * Auth: pulls the same `access_token` from localStorage that AuthContext sets
 * after Marevlo login.  The backend's MIRA module decodes that JWT directly
 * (no Firebase round-trip per request).
 *
 * Base URL: `import.meta.env.VITE_API_URL` — same env var the rest of the
 * frontend uses (e.g. http://localhost:8000 in dev, /api in Vercel prod).
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getAuthToken() {
  return localStorage.getItem("access_token");
}

function buildHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers: extraHeaders = {}, ...rest } = options;

  const fetchOpts = { method, headers: buildHeaders(extraHeaders), ...rest };
  if (body !== undefined) {
    fetchOpts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const url = `${API_BASE}${path}`;
  let resp;
  try {
    resp = await fetch(url, fetchOpts);
  } catch (e) {
    throw new MiraApiError("network_error", "Network request failed", 0, e);
  }

  const isJson = (resp.headers.get("content-type") || "").includes("application/json");

  if (!resp.ok) {
    let errorBody = null;
    try {
      errorBody = isJson ? await resp.json() : await resp.text();
    } catch {
      errorBody = "<unreadable error body>";
    }
    const detail =
      (errorBody && typeof errorBody === "object" && errorBody.detail) ||
      (typeof errorBody === "string" ? errorBody : "Request failed");
    throw new MiraApiError(_statusCode(resp.status), detail, resp.status, errorBody);
  }

  return isJson ? await resp.json() : await resp.text();
}

function _statusCode(status) {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "client_error";
}

export class MiraApiError extends Error {
  constructor(code, message, status = 0, raw = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.raw = raw;
    this.name = "MiraApiError";
  }
}

export const miraApi = {
  featureCheck: () => apiRequest("/api/mira/feature-check"),
  chat:        (payload) => apiRequest("/api/mira/chat",     { method: "POST",  body: payload }),
  feedback:    ({ concept_id, style_used, understood }) =>
                apiRequest("/api/mira/feedback", { method: "POST", body: { concept_id, style_used, understood } }),
  getProfile:  () => apiRequest("/api/mira/profile"),
  getQuota:    () => apiRequest("/api/mira/quota"),
  getRecent:   (limit = 20) => apiRequest(`/api/mira/recent?limit=${limit}`),
  getPreferences: () => apiRequest("/api/mira/preferences"),
  updatePreferences: (updates) => apiRequest("/api/mira/preferences", { method: "PATCH", body: updates }),
};
