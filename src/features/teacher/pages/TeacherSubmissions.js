// src/features/teacher/pages/TeacherSubmissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE as RAW } from "../../../lib/api";

export default function TeacherSubmissions() {
  const token = localStorage.getItem("token");
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const API_BASE = useMemo(() => (RAW || "").replace(/\/+$/, ""), []);

  // ตัวกรอง
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");

  // ข้อมูลงานที่ส่ง
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const safeJson = async (res) => {
    const t = await res.text();
    try { return { json: JSON.parse(t), raw: t }; } catch { return { json: null, raw: t }; }
  };

  // โหลดรายวิชาที่สอน
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr("");
        const res = await fetch(`${API_BASE}/api/v1/courses`, { headers: auth });
        const { json, raw } = await safeJson(res);
        if (!res.ok) throw new Error(json?.message || raw || "โหลดรายวิชาไม่สำเร็จ");
        const list = Array.isArray(json) ? json : (json?.data || []);
        setCourses(list);
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE, auth]);

  // เมื่อเลือก course → โหลด sections
  useEffect(() => {
    setSections([]); setSectionId(""); setAssignments([]); setAssignmentId(""); setSubmissions([]);
    if (!courseId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses/${courseId}/detail`, { headers: auth });
        const { json, raw } = await safeJson(res);
        if (!res.ok) throw new Error(json?.message || raw || "โหลด Section ไม่สำเร็จ");
        const s = json?.sections || [];
        setSections(s);
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
      }
    })();
  }, [courseId, API_BASE, auth]);

  // เมื่อเลือก section → โหลด assignments
  useEffect(() => {
    setAssignments([]); setAssignmentId(""); setSubmissions([]);
    if (!sectionId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/sections/${sectionId}/assignments`, { headers: auth });
        const { json, raw } = await safeJson(res);
        if (!res.ok) throw new Error(json?.message || raw || "โหลดงานไม่สำเร็จ");
        const payload = json?.data ?? json;
        const list = (Array.isArray(payload?.assignments) && payload.assignments) ||
                     (Array.isArray(payload) && payload) || [];
        setAssignments(list);
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
      }
    })();
  }, [sectionId, API_BASE, auth]);

  // เมื่อเลือก assignment → โหลด submissions ของชิ้นงานนั้น
  useEffect(() => {
    setSubmissions([]);
    if (!assignmentId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/assignments/${assignmentId}/submissions`, { headers: auth });
        const { json, raw } = await safeJson(res);
        if (!res.ok) throw new Error(json?.message || raw || "โหลดงานที่ส่งไม่สำเร็จ");
        const list = Array.isArray(json?.data) ? json.data : (json || []);
        setSubmissions(list);
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId, API_BASE, auth]);

  // ให้คะแนน
  const [grading, setGrading] = useState({ id: null, score: "", feedback: "" });
  const openGrade = (s) => setGrading({ id: s.id, score: s.score ?? "", feedback: s.feedback ?? "" });
  const cancelGrade = () => setGrading({ id: null, score: "", feedback: "" });

  const submitGrade = async () => {
  if (!grading.id) return;
  const payload = { score: Number(grading.score), feedback: grading.feedback || "" };

  const tryFetch = async (url) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { json, raw } = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || raw || "บันทึกคะแนนไม่สำเร็จ");
  };

  try {
    await tryFetch(`${API_BASE}/api/v1/submissions/${grading.id}/grade`);
  } catch {
    // เผื่อ backend เก่าที่ยังรับที่ /assignments/{id}/grade
    await tryFetch(`${API_BASE}/api/v1/assignments/${grading.id}/grade`);
  }

  setSubmissions(prev =>
    prev.map(x => x.id === grading.id ? { ...x, score: Number(grading.score), feedback: grading.feedback } : x)
  );
  cancelGrade();
  alert("บันทึกคะแนนแล้ว");
};

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4><i className="bi bi-inbox-arrow-down me-2" />Submissions</h4>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body row g-3">
          <div className="col-md-4">
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={(e)=>setCourseId(e.target.value)}>
              <option value="">— Select —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Section</label>
            <select className="form-select" value={sectionId} onChange={(e)=>setSectionId(e.target.value)} disabled={!courseId}>
              <option value="">— Select —</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.sectionNo} ({s.term})</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Assignment</label>
            <select className="form-select" value={assignmentId} onChange={(e)=>setAssignmentId(e.target.value)} disabled={!sectionId}>
              <option value="">— Select —</option>
              {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">กำลังโหลด…</div>
          ) : !assignmentId ? (
            <div className="text-muted">เลือก Course → Section → Assignment เพื่อดูงานที่ส่ง</div>
          ) : submissions.length === 0 ? (
            <div className="text-muted">ยังไม่มีการส่งงาน</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Student</th>
                    <th>Submitted At</th>
                    <th>Files</th>
                    <th>Score</th>
                    <th>Feedback</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.student?.fullname || s.studentName || s.studentId}</td>
                      <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleString("th-TH") : "-"}</td>
                      <td>
                        {(s.attachments || s.attachmentUrls || []).map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer" className="me-2">
                            ไฟล์{i+1}
                          </a>
                        ))}
                      </td>
                      <td>{s.score ?? "-"}</td>
                      <td className="text-truncate" style={{maxWidth:240}}>{s.feedback || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openGrade(s)}>
                          ให้คะแนน
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grade modal (ง่าย ๆ) */}
      {grading.id && (
        <div className="modal fade show" style={{display:"block", background:"rgba(0,0,0,.45)"}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">ให้คะแนน</h5>
                <button className="btn-close" onClick={cancelGrade}/>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">คะแนน</label>
                  <input type="number" className="form-control"
                    value={grading.score}
                    onChange={(e)=>setGrading((g)=>({...g, score: e.target.value}))}/>
                </div>
                <div className="mb-3">
                  <label className="form-label">Feedback</label>
                  <textarea className="form-control" rows={3}
                    value={grading.feedback}
                    onChange={(e)=>setGrading((g)=>({...g, feedback: e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={cancelGrade}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={submitGrade}>บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}

            <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </div>
  );
}
