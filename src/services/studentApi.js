// src/services/studentApi.js
import { API_BASE } from "../lib/api";

const BASE = (API_BASE || "").replace(/\/+$/, "");

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Accept: "application/json",
  };
}

async function safeGet(url, fallback) {
  const res = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // noop
  }

  if (!res.ok) {
    // 404/403/500 ให้คืน fallback ไปก่อนเพื่อไม่ให้หน้าแตก
    return fallback;
  }
  return json?.data ?? json ?? fallback;
}

/** ---------------- Dashboard ---------------- **/
export async function getDashboard(who = "me", opts = {}) {
  const url = `${BASE}/api/v1/students/${encodeURIComponent(who)}/dashboard`;
  const headers = authHeaders();
  const res = await fetch(url, { headers, ...opts });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(json?.message || text || `Fetch dashboard failed (${res.status})`);
  }
  return json?.data ?? json;
}

/** ---------------- Attendance history ---------------- **/
export async function getAttendanceHistory(who = "me") {
  // ถ้ามี endpoint จริงให้แก้ path ตามของคุณ
  const url = `${BASE}/api/v1/students/${encodeURIComponent(who)}/attendance`;
  // รูปแบบผลลัพธ์คาดหวัง: [{date, courseCode, courseTitle, section, status}, ...]
  return safeGet(url, []);
}

/** ---------------- Upcoming exams ---------------- **/
export async function getUpcomingExams(who = "me") {
  // ถ้ามี endpoint จริงให้แก้ path
  const url = `${BASE}/api/v1/students/${encodeURIComponent(who)}/exams/upcoming`;
  // คาดหวัง: [{date, time, courseCode, courseTitle, room, note}, ...]
  return safeGet(url, []);
}

/** ---------------- Points / Grade ---------------- **/
export async function getPoints(who = "me") {
  // ถ้ามี endpoint จริงให้แก้ path
  const url = `${BASE}/api/v1/students/${encodeURIComponent(who)}/points`;
  // คาดหวัง: [{assignmentId, title, score, maxScore, weight}, ...]
  return safeGet(url, []);
}

export async function getGradeConfig(who = "me") {
  // ถ้ามี endpoint จริงให้แก้ path
  const url = `${BASE}/api/v1/students/${encodeURIComponent(who)}/grade-config`;
  // คาดหวัง: {scale:[{min,max,grade}], weights:{assignment:40, quiz:20, exam:40}, ...}
  return safeGet(url, { scale: [], weights: {} });
}
