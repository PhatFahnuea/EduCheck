export const API_BASE = import.meta?.env?.VITE_API_BASE ?? "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token"); // รองรับของเดิม
}
export function setToken(token, type = "Bearer") {
  localStorage.setItem("access_token", token);
  localStorage.setItem("token_type", type || "Bearer");
}
export function clearToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("token");
}
export async function apiFetch(input, init = {}) {
  const url = input.startsWith("http") ? input : `${API_BASE}${input}`;
  const headers = new Headers(init.headers || {});
  const tok = getToken();
  if (tok) headers.set("Authorization", `Bearer ${tok}`);
  // ถ้าระบบคุณใช้ Cookie session ให้เพิ่ม: init.credentials = "include"
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

export async function apiJson(input, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const res = await apiFetch(input, { ...init, headers });
  return res.json();
}
