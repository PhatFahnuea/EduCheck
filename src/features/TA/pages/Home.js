import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE as RAW } from "../../../lib/api";

export default function Home() {
  const navigate = useNavigate();
  const API_BASE = useMemo(() => (RAW || "").replace(/\/+$/, ""), []);
  const token = localStorage.getItem("token");
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState([]); // [{courseCode,courseTitle,sectionNo,term,studentCount}]

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/v1/sections/stats`, { headers: auth });
        const txt = await res.text();
        const json = (() => { try { return JSON.parse(txt); } catch { return null; } })();
        if (!res.ok) throw new Error(json?.message || txt || "load stats failed");
        const data = json?.data || json || [];
        if (alive) setStats(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e.message || "โหลดสถิติไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [API_BASE, auth]);

  const createAttendance = () => {
    // ไปหน้าเช็คอิน/สร้าง QR (คุณมี Route นี้แล้วใน AppRoutes)
    navigate("/attendance/checkin");
    // ถ้าอยากให้ไปหน้าอื่น เปลี่ยน path ข้างบน
    // เช่น navigate("/teacher/attendance/create");
  };

  const totalStudents = stats.reduce((s, x) => s + (Number(x.studentCount) || 0), 0);
  const totalSections = stats.length;
  const totalCourses = new Set(stats.map(s => s.courseId)).size;

  return (
    <div className="content-wrap">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mt-2 mb-0">Dashboard</h4>

        <button className="btn btn-primary" onClick={createAttendance}>
          <i className="bi bi-qr-code-scan me-2" />
          Create Attendance (Gen QR)
        </button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3">
            <div className="text-muted small">นักศึกษารวม</div>
            <div className="h3 mb-0">{loading ? "…" : totalStudents}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3">
            <div className="text-muted small">Sections</div>
            <div className="h3 mb-0">{loading ? "…" : totalSections}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3">
            <div className="text-muted small">Courses</div>
            <div className="h3 mb-0">{loading ? "…" : totalCourses}</div>
          </div>
        </div>
      </div>

      <div className="card p-3">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-people me-2" />
          <strong>จำนวนนักศึกษาตามวิชา/Section</strong>
        </div>

        {loading ? (
          <div className="text-muted">กำลังโหลด…</div>
        ) : stats.length === 0 ? (
          <div className="text-muted">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{width: 140}}>รหัสวิชา</th>
                  <th>ชื่อวิชา</th>
                  <th style={{width: 100}}>Section</th>
                  <th style={{width: 140}}>ภาค/ปี</th>
                  <th style={{width: 140}} className="text-end">จำนวนนศ.</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={`${s.sectionId}`}>
                    <td><span className="badge bg-light text-dark">{s.courseCode}</span></td>
                    <td>{s.courseTitle}</td>
                    <td>#{s.sectionNo}</td>
                    <td>{s.term || "-"}</td>
                    <td className="text-end">{s.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* icons (ถ้ายังไม่มีใน index.html) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </div>
  );
}
