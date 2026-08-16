const configuredBase = import.meta.env.VITE_API_URL?.trim();
const BASE = configuredBase
  ? configuredBase.replace(/\/$/, "")
  : "https://ayursutra-sih-g9gn.onrender.com";

function getToken() {
  return localStorage.getItem("ayursutra_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  get: (path: string) => request(path, { method: "GET" }),
  post: (path: string, data?: any) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path: string, data?: any) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path: string, data?: any) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};
