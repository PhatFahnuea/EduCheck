import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

const fallbackImg =
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop";

export default function Subject() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ปรับ API_BASE ให้ไม่มี / ท้ายสุด
  const API_BASE = useMemo(() => (API_BASE_RAW || "").replace(/\/+$/, ""), []);
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // สร้าง URL รูปจาก path ที่ DB เก็บ (เช่น "/uploads/courses/xyz.png")
  const imgUrl = (img) => {
    if (!img) return fallbackImg;
    if (/^https?:\/\//i.test(img)) return img;                // เป็น URL เต็มอยู่แล้ว
    const path = img.startsWith("/") ? img : `/${img}`;       // บังคับมี / ต้นทาง
    return `${API_BASE}${path}`;                              // ต่อกับโดเมน backend
  };

  useEffect(() => {
    if (!token) {
      // ถ้าไม่มี token จะไปหน้า login หรือแสดง error ก็ได้
      setErr("กรุณาเข้าสู่ระบบ");
      setLoading(false);
      // navigate("/login"); // ถ้าต้องการ
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/v1/courses`, {
          headers: auth,
          signal: ac.signal,
        });

        // พยายาม parse JSON ก่อน ถ้า error ค่อยดึงข้อความดิบ
        let data;
        try {
          data = await res.json();
        } catch {
          const text = await res.text();
          throw new Error(text || `โหลดรายวิชาล้มเหลว (${res.status})`);
        }

        if (!res.ok) {
          throw new Error(data?.message || `โหลดรายวิชาล้มเหลว (${res.status})`);
        }

        const rows = Array.isArray(data) ? data : (data?.data || []);
        setSubjects(rows);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "โหลดรายวิชาล้มเหลว");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [auth, API_BASE, navigate, token]);

  const goAddCourse = () => navigate("/teacher/subject/add");
const onCardClick = (s) => {
  navigate(`/teacher/subject/${s.id}`);
};

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4>Your course</h4>
        <button className="btn btn-primary" onClick={goAddCourse}>
          + Add Subject
        </button>
      </div>

      {loading && <div className="alert alert-secondary">กำลังโหลด…</div>}
      {err && !loading && <div className="alert alert-danger">{err}</div>}
      {!loading && !err && subjects.length === 0 && (
        <div className="alert alert-info">ยังไม่มีรายวิชา — กด “Add Subject” เพื่อสร้างรายวิชาแรก</div>
      )}

      <div className="row g-4">
        {subjects.map((s) => (
          <div key={s.id} className="col-12 col-md-6 col-lg-4">
            <div
              role="button"
              className="card h-100 border-0 shadow-sm course-card"
              onClick={() => onCardClick(s)}
            >
              <div className="ratio ratio-16x9">
                <img
                  src={imgUrl(s.img)}
                  alt={s.title || s.code}
                  className="card-img-top object-fit-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  style={{ borderTopLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem" }}
                />
              </div>

              <div className="card-body">
                <h5 className="card-title mb-2 text-truncate" title={s.title || s.code}>
                  {s.title || s.name || s.code}
                </h5>

                <div className="text-muted mb-2" style={{ fontSize: "0.95rem" }}>
                  {s.code}
                </div>

                <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: ".9rem" }}>
                  <span className="d-inline-flex align-items-center gap-1">
                    <Users size={16} /> {s.students ?? 0}
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <CalendarDays size={16} /> TBA
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .course-card:hover{
          transform: translateY(-2px);
          transition: transform .12s ease, box-shadow .12s ease;
          box-shadow: 0 10px 22px rgba(2,6,23,.08);
        }
        .object-fit-cover{ object-fit: cover; }
        .text-truncate{
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
        }
      `}</style>
           {/* icons (ถ้ายังไม่มีใน index.html) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </div>
  );
}
