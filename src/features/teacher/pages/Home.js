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

  // สถิติ section/นักศึกษา
  const [stats, setStats] = useState([]); // [{courseId,courseCode,courseTitle,sectionId,sectionNo,term,studentCount}]

  // สอบที่กำลังจะถึง
  const [exams, setExams] = useState([]); // [{id, title, courseCode, sectionNo, examDateTime, location}]
  const [examErr, setExamErr] = useState("");
  const [examLoading, setExamLoading] = useState(true);

  const safeJson = async (res) => {
    const text = await res.text();
    try { return { json: JSON.parse(text), raw: text }; }
    catch { return { json: null, raw: text }; }
  };

  // ---------- load stats ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/v1/sections/stats`, { headers: auth });
        const { json, raw } = await safeJson(res);
        if (!res.ok) throw new Error(json?.message || raw || "load stats failed");
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

  // ---------- load upcoming exams ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      setExamLoading(true);
      setExamErr("");
      try {
        // 1) mine?upcoming
        let res = await fetch(`${API_BASE}/api/v1/exams/mine?upcoming=true&limit=5`, { headers: auth });
        let { json, raw } = await safeJson(res);

        if (!res.ok) {
          // 2) fallback: /exams?upcoming
          res = await fetch(`${API_BASE}/api/v1/exams?upcoming=true&limit=5`, { headers: auth });
          ({ json, raw } = await safeJson(res));
        }

        let list = [];
        if (res.ok) {
          const payload = json?.data ?? json;
          list = Array.isArray(payload) ? payload : (payload?.items || []);
        } else {
          // 3) ดึงทั้งหมดแล้วกรองเอง (ถ้า backend ยังไม่มี upcoming param)
          const rAll = await fetch(`${API_BASE}/api/v1/exams`, { headers: auth });
          const { json: jAll, raw: rawAll } = await safeJson(rAll);
          if (!rAll.ok) throw new Error(jAll?.message || rawAll || "โหลดกำหนดสอบไม่สำเร็จ");
          const all = Array.isArray(jAll?.data) ? jAll.data : (jAll || []);
          const now = Date.now();
          list = all
            .filter(x => x.examDateTime ? new Date(x.examDateTime).getTime() >= now : false)
            .sort((a,b) => new Date(a.examDateTime) - new Date(b.examDateTime))
            .slice(0, 5);
        }

        // ปรับให้อยู่ในรูปที่ render ง่าย
        const norm = (list || []).map(x => ({
          id: x.id,
          title: x.title || x.examTitle || "การสอบ",
          courseCode: x.courseCode || x.course?.code,
          courseTitle: x.courseTitle || x.course?.title,
          sectionNo: x.sectionNo || x.section?.sectionNo,
          term: x.term || x.section?.term,
          examDateTime: x.examDateTime || x.datetime || x.exam_at,
          location: x.location || x.room || "-",
        }));
        if (alive) setExams(norm);
      } catch (e) {
        if (alive) setExamErr(e.message || "โหลดกำหนดสอบไม่สำเร็จ");
      } finally {
        if (alive) setExamLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [API_BASE, auth]);

  // ---------- derived ----------
  const totalStudents = stats.reduce((s, x) => s + (Number(x.studentCount) || 0), 0);
  const totalSections = stats.length;
  const totalCourses = new Set(stats.map(s => s.courseId)).size;

  // ---------- nav handlers ----------
  const goNewExam = () => navigate("/teacher/exams/new");
  const goAllExams = () => navigate("/teacher/exams");

  // ---------- render ----------
  return (
    <div className="content-wrap">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mt-2 mb-0">Dashboard</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={goAllExams}>
            <i className="bi bi-calendar3 me-1" />
            ปฏิทินสอบ
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="text-muted small">นักศึกษารวม</div>
            <div className="h3 mb-0">{loading ? "…" : totalStudents}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="text-muted small">Sections</div>
            <div className="h3 mb-0">{loading ? "…" : totalSections}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="text-muted small">Courses</div>
            <div className="h3 mb-0">{loading ? "…" : totalCourses}</div>
          </div>
        </div>
      </div>

      {/* Upcoming exams */}
      <div className="card p-3 shadow-sm mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-alarm me-2" />
            <strong>กำหนดสอบที่จะถึง</strong>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={goAllExams}>
            ดูทั้งหมด
          </button>
        </div>

        {examLoading ? (
          <div className="text-muted">กำลังโหลด…</div>
        ) : examErr ? (
          <div className="alert alert-warning py-2 mb-0">
            <i className="bi bi-exclamation-triangle me-2" />
            {examErr}
          </div>
        ) : exams.length === 0 ? (
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
            <span className="text-muted">ยังไม่มีนัดสอบ</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{width: 160}}>วัน–เวลา</th>
                  <th>สอบ</th>
                  <th style={{width: 140}}>รหัสวิชา</th>
                  <th style={{width: 90}}>Sec.</th>
                  <th style={{width: 160}}>ภาค/ปี</th>
                  <th style={{width: 160}}>ห้อง/สถานที่</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(ex => (
                  <tr key={ex.id}>
                    <td>
                      {ex.examDateTime
                        ? new Date(ex.examDateTime).toLocaleString("th-TH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })
                        : "-"}
                    </td>
                    <td className="fw-semibold">{ex.title}</td>
                    <td><span className="badge bg-light text-dark">{ex.courseCode || "-"}</span></td>
                    <td>#{ex.sectionNo ?? "-"}</td>
                    <td>{ex.term || "-"}</td>
                    <td>{ex.location || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section stats table */}
      <div className="card p-3 shadow-sm">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-people me-2" />
          <strong>จำนวนนักศึกษาตามวิชา/Section</strong>
        </div>

        {loading ? (
          <div className="text-muted">กำลังโหลด…</div>
        ) : err ? (
          <div className="alert alert-warning py-2 mb-0">
            <i className="bi bi-exclamation-circle me-2" />
            {err}
          </div>
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

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </div>
  );
}
