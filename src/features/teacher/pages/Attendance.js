// src/features/teacher/pages/Attendance.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

export default function Attendance() {
  const token = localStorage.getItem("token");
  const API_BASE = useMemo(() => (API_BASE_RAW || "").replace(/\/+$/, ""), []);
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // mock รายชื่อนักศึกษา (ปรับไปดึง API จริงภายหลังได้)
  const [students, setStudents] = useState([
    { studentId: 65001, name: "Alice", email: "alice@gg.com", status: "Active", note: "รอใบรับรองแพทย์" },
    { studentId: 65002, name: "Bob", email: "bob@gg.com", status: "Inactive", note: " " },
  ]);

  // global absences
  const [absences, setAbsences] = useState([]);
  const [loadingAbs, setLoadingAbs] = useState(false);
  const [absError, setAbsError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  // modal: create absence
  const [showCreateAbs, setShowCreateAbs] = useState(false);
  const [createAbs, setCreateAbs] = useState({
    studentId: "",
    date: "",
    periodStart: "",
    periodEnd: "",
    reason: "",
    attachments: [],
    courseId: "",
    sectionId: "",
  });

  // modal: review absence
  const [showReview, setShowReview] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (filterStudentId) p.set("studentId", filterStudentId);
    if (filterCourseId)  p.set("courseId", filterCourseId);
    if (filterSectionId) p.set("sectionId", filterSectionId);
    const qstr = p.toString();
    return qstr ? `?${qstr}` : "";
    };

  const loadAbsences = async () => {
    setLoadingAbs(true);
    setAbsError("");
    try {
      const r = await fetch(`${API_BASE}/api/v1/absences${buildQuery()}`, { headers: auth });
      const text = await r.text();
      const j = safeJson(text);
      if (!r.ok) throw new Error(j?.message || text || "โหลดใบลาไม่สำเร็จ");
      const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
      setAbsences(arr);
    } catch (e) {
      setAbsError(e.message || "โหลดใบลาไม่สำเร็จ");
      setAbsences([]);
    } finally {
      setLoadingAbs(false);
    }
  };

  useEffect(() => { loadAbsences(); /* eslint-disable-next-line */ }, [filterStudentId, filterCourseId, filterSectionId]);

  // student row click → เปิด modal create ลาให้คนนั้น
  const openCreateFor = (s) => {
    setCreateAbs({
      studentId: s.studentId || "",
      date: "",
      periodStart: "",
      periodEnd: "",
      reason: "",
      attachments: [],
      courseId: "",
      sectionId: "",
    });
    setShowCreateAbs(true);
  };

  const submitCreateAbs = async () => {
    if (!createAbs.studentId || !createAbs.date) return;

    const payload = {
      studentId: Number(createAbs.studentId),
      date: createAbs.date,
      periodStart: createAbs.periodStart || null,
      periodEnd: createAbs.periodEnd || null,
      reason: createAbs.reason || "",
      attachments: createAbs.attachments || [],
      courseId: createAbs.courseId ? Number(createAbs.courseId) : null,
      sectionId: createAbs.sectionId ? Number(createAbs.sectionId) : null,
    };

    try {
      const r = await fetch(`${API_BASE}/api/v1/absences`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      const j = safeJson(text);
      if (!r.ok) throw new Error(j?.message || text || "ยื่นใบลาไม่สำเร็จ");
      setShowCreateAbs(false);
      await loadAbsences();
    } catch (e) {
      alert(e.message || "ยื่นใบลาไม่สำเร็จ");
    }
  };

  const doReview = async (status) => {
    if (!reviewItem) return;
    try {
      const payload = { status, reviewerNote: reviewNote, reviewerId: null };
      const r = await fetch(`${API_BASE}/api/v1/absences/${reviewItem.id}/review`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      const j = safeJson(text);
      if (!r.ok) throw new Error(j?.message || text || "ดำเนินการไม่สำเร็จ");
      setShowReview(false);
      setReviewItem(null);
      setReviewNote("");
      await loadAbsences();
    } catch (e) {
      alert(e.message || "ดำเนินการไม่สำเร็จ");
    }
  };

  const filteredStudents = students.filter(s =>
    !q || `${s.studentId} ${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4>Attendance & Leaves (Global)</h4>
      </div>

      {/* Global absences */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
            <h5 className="mb-0">ใบลา (ทั้งหมด)</h5>
            <div className="d-flex gap-2">
              <input className="form-control form-control-sm" style={{width:140}} placeholder="studentId" value={filterStudentId} onChange={(e)=>setFilterStudentId(e.target.value)} />
              <input className="form-control form-control-sm" style={{width:140}} placeholder="courseId" value={filterCourseId} onChange={(e)=>setFilterCourseId(e.target.value)} />
              <input className="form-control form-control-sm" style={{width:140}} placeholder="sectionId" value={filterSectionId} onChange={(e)=>setFilterSectionId(e.target.value)} />
              <button className="btn btn-sm btn-outline-secondary" onClick={loadAbsences} disabled={loadingAbs}>
                รีเฟรช
              </button>
            </div>
          </div>
          
          {loadingAbs ? (
            <div className="text-muted">กำลังโหลด…</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Course/Section</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{width:180}}></th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.studentId} — {a.studentName}</td>
                      <td>{a.date}</td>
                      <td>{a.periodStart && a.periodEnd ? `${a.periodStart}-${a.periodEnd}` : "-"}</td>
                      <td>{a.courseId || "-"} / {a.sectionId || "-"}</td>
                      <td className="text-truncate" style={{maxWidth:260}}>{a.reason || "-"}</td>
                      <td>
                        <span className={`badge ${a.status === "APPROVED" ? "bg-success" : a.status === "REJECTED" ? "bg-danger" : "bg-secondary"}`}>{a.status}</span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setReviewItem(a); setReviewNote(a.reviewerNote || ""); setShowReview(true); }}>
                          ตรวจสอบ
                        </button>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (!window.confirm("ลบใบลานี้?")) return;
                            const r = await fetch(`${API_BASE}/api/v1/absences/${a.id}`, { method: "DELETE", headers: auth });
                            if (r.ok) loadAbsences();
                          }}>
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                  {absences.length === 0 && <tr><td colSpan={8} className="text-center text-muted">ยังไม่มีใบลา</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Absence Modal */}
      {showCreateAbs && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">ยื่นใบลา (Global)</h5>
              <button type="button" className="btn-close" onClick={() => setShowCreateAbs(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label">studentId *</label>
                  <input className="form-control" value={createAbs.studentId} onChange={(e)=>setCreateAbs(v=>({...v,studentId:e.target.value}))}/>
                </div>
                <div className="col-md-4">
                  <label className="form-label">วันที่ลา *</label>
                  <input type="date" className="form-control" value={createAbs.date} onChange={(e)=>setCreateAbs(v=>({...v,date:e.target.value}))}/>
                </div>
                <div className="col-md-2">
                  <label className="form-label">เริ่ม</label>
                  <input type="time" className="form-control" value={createAbs.periodStart} onChange={(e)=>setCreateAbs(v=>({...v,periodStart:e.target.value}))}/>
                </div>
                <div className="col-md-2">
                  <label className="form-label">สิ้นสุด</label>
                  <input type="time" className="form-control" value={createAbs.periodEnd} onChange={(e)=>setCreateAbs(v=>({...v,periodEnd:e.target.value}))}/>
                </div>
              </div>
              <div className="row g-2 mt-1">
                <div className="col-md-6">
                  <label className="form-label">courseId (optional)</label>
                  <input className="form-control" value={createAbs.courseId} onChange={(e)=>setCreateAbs(v=>({...v,courseId:e.target.value}))}/>
                </div>
                <div className="col-md-6">
                  <label className="form-label">sectionId (optional)</label>
                  <input className="form-control" value={createAbs.sectionId} onChange={(e)=>setCreateAbs(v=>({...v,sectionId:e.target.value}))}/>
                </div>
              </div>
              <div className="mt-2">
                <label className="form-label">เหตุผล</label>
                <textarea className="form-control" rows={3} value={createAbs.reason} onChange={(e)=>setCreateAbs(v=>({...v,reason:e.target.value}))}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={submitCreateAbs}>ส่งใบลา</button>
            </div>
          </div></div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && reviewItem && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">ตรวจสอบใบลา #{reviewItem.id}</h5>
              <button type="button" className="btn-close" onClick={()=>{setShowReview(false); setReviewItem(null);}}></button>
            </div>
            <div className="modal-body">
              <div className="mb-2"><strong>นักศึกษา:</strong> {reviewItem.studentId} — {reviewItem.studentName}</div>
              <div className="mb-2"><strong>วันที่:</strong> {reviewItem.date}</div>
              <div className="mb-2"><strong>เวลา:</strong> {reviewItem.periodStart && reviewItem.periodEnd ? `${reviewItem.periodStart}-${reviewItem.periodEnd}` : "-"}</div>
              <div className="mb-2"><strong>Course/Section:</strong> {reviewItem.courseId || "-"} / {reviewItem.sectionId || "-"}</div>
              <div className="mb-2"><strong>เหตุผล:</strong> {reviewItem.reason || "-"}</div>
              <div className="mb-2">
                <label className="form-label">หมายเหตุผู้ตรวจ</label>
                <textarea className="form-control" rows={3} value={reviewNote} onChange={(e)=>setReviewNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={() => doReview("APPROVED")}>อนุมัติ</button>
              <button className="btn btn-danger" onClick={() => doReview("REJECTED")}>ปฏิเสธ</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  );
}

function safeJson(t){ try{ return JSON.parse(t);}catch{return null;}}
