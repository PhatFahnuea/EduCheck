import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

export default function CourseAssignments() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ===== Config =====
  const API_BASE = useMemo(() => {
    const raw = (API_BASE_RAW && API_BASE_RAW.trim()) || "http://localhost:8080";
    return raw.replace(/\/+$/, "");
  }, []);

  const token = localStorage.getItem("token");
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // ===== Resolve current user id (หลายชั้น + รองรับ query) =====
  const [currentUserId, setCurrentUserId] = useState(null);
  const [resolvingUser, setResolvingUser] = useState(true);
  const [manualId, setManualId] = useState("");

  const decodeJwt = (t) => {
    try {
      const p = t.split(".")[1];
      const json = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
      return json || {};
    } catch { return {}; }
  };

  const safeJson = async (res) => {
    const text = await res.text();
    try { return { json: JSON.parse(text), raw: text }; }
    catch { return { json: null, raw: text }; }
  };

  const fetchUserIdFromServer = async () => {
    const candidates = ["/api/v1/users/me", "/api/v1/me", "/api/v1/auth/me", "/api/v1/profile"];
    for (const path of candidates) {
      try {
        const r = await fetch(`${API_BASE}${path}`, { headers: auth });
        const { json } = await safeJson(r);
        if (r.ok && json) {
          const p = json?.data ?? json;
          const id = p?.id ?? p?.userId ?? p?.uid ?? null;
          if (id != null) return Number(id);
        }
      } catch { /* ignore */ }
    }
    return null;
  };

  const ensureUserId = async () => {
    // 1) query string ?studentId= / ?sid=
    const q = new URLSearchParams(location.search);
    const qId = q.get("studentId") || q.get("sid");
    if (qId && !Number.isNaN(Number(qId))) return Number(qId);

    // 2) localStorage
    try {
      const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (typeof cachedUser?.id === "number") return cachedUser.id;
    } catch {}
    const cached = localStorage.getItem("userId");
    if (cached && !Number.isNaN(Number(cached))) return Number(cached);

    // 3) server endpoints
    const fromServer = await fetchUserIdFromServer();
    if (fromServer != null) return fromServer;

    // 4) decode JWT
    if (token) {
      const p = decodeJwt(token);
      const guess = p?.id ?? p?.userId ?? p?.uid ?? p?.sub ?? null;
      if (guess != null && !Number.isNaN(Number(guess))) return Number(guess);
    }
    return null;
  };

  useEffect(() => {
    (async () => {
      setResolvingUser(true);
      const id = await ensureUserId();
      if (id != null) {
        setCurrentUserId(id);
        // cache
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          if (typeof u === "object") {
            u.id = id;
            localStorage.setItem("user", JSON.stringify(u));
          }
        } catch {}
        localStorage.setItem("userId", String(id));
      }
      setResolvingUser(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, token, location.search]);

  // ===== Section / Course =====
  const [qsSection] = useState(() => {
    const q = new URLSearchParams(location.search);
    const v = q.get("section");
    return v ? Number(v) : null;
  });

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---------- Modal/Detail ----------
  const [detail, setDetail] = useState(null);

  // ข้อมูลงานส่งของ "ฉัน"
  const [mySub, setMySub] = useState(null);
  const [savingSub, setSavingSub] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // โหลดรายวิชา + sections
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) /detail
        const resDetail = await fetch(`${API_BASE}/api/v1/courses/${courseId}/detail`, { headers: auth });
        if (resDetail.ok) {
          const { json } = await safeJson(resDetail);
          const dataCourse = json?.data || json;
          setCourse(dataCourse?.course || dataCourse);
          setSections(dataCourse?.sections || []);
        } else {
          // 2) fallback /courses/{id}
          const rc = await fetch(`${API_BASE}/api/v1/courses/${courseId}`, { headers: auth });
          const { json: cj } = await safeJson(rc);
          if (!rc.ok) throw new Error(cj?.message || "โหลดรายวิชาไม่สำเร็จ");
          setCourse(cj?.data || cj);
          setSections([]);
        }
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, auth, courseId]);

  // เลือก section อัตโนมัติ
  useEffect(() => {
    if (qsSection) { setActiveSectionId(qsSection); return; }
    if (sections.length === 1) setActiveSectionId(sections[0].id);
  }, [qsSection, sections]);

  // โหลด assignments
  useEffect(() => {
    if (!activeSectionId) { setAssignments([]); return; }
    (async () => {
      try {
        setErr("");
        const aRes = await fetch(`${API_BASE}/api/v1/sections/${activeSectionId}/assignments`, { headers: auth });
        const { json: aJson } = await safeJson(aRes);
        if (!aRes.ok) throw new Error(aJson?.message || "โหลดงานไม่สำเร็จ");
        const list = aJson?.data || aJson;
        setAssignments(Array.isArray(list) ? list : (list?.assignments || []));
      } catch (e) {
        setErr(e.message || "เกิดข้อผิดพลาด");
        setAssignments([]);
      }
    })();
  }, [API_BASE, auth, activeSectionId]);

  // ---------- Submission ----------
  const loadMySubmission = async (assignmentId) => {
    if (!currentUserId) return null;
    // มาตรฐาน
    const url = `${API_BASE}/api/v1/assignments/${assignmentId}/my-submission?studentId=${currentUserId}`;
    const res = await fetch(url, { headers: auth });
    const { json, raw } = await safeJson(res);
    if (res.ok) return json?.data || json || null;

    // fallback: alias /me
    const res2 = await fetch(`${API_BASE}/api/v1/assignments/${assignmentId}/my-submissions/me`, {
      headers: { ...auth, "X-User-Id": currentUserId }
    });
    const { json: j2, raw: r2 } = await safeJson(res2);
    if (res2.ok) return j2?.data || j2 || null;

    if (res.status !== 404) showToast(json?.message || raw || "โหลดข้อมูลการส่งไม่สำเร็จ");
    return null;
  };

  const openDetail = async (a) => {
    if (!currentUserId) { showToast("ไม่พบรหัสผู้ใช้"); return; }
    setDetail(a);
    setMySub(null);
    try {
      const sub = await loadMySubmission(a.id);
      const normalized = sub ? {
        status: sub.status || (sub.submittedAt ? "SUBMITTED" : "DRAFT"),
        attachments: sub.attachments || sub.attachmentUrls || [],
        note: sub.note || "",
        score: sub.score ?? null,
        feedback: sub.feedback || "",
        updatedAt: sub.updatedAt || sub.submittedAt || null,
        id: sub.id,
      } : { status: "DRAFT", attachments: [], note: "" };
      setMySub(normalized);
    } catch {
      setMySub({ status: "DRAFT", attachments: [], note: "" });
    }
  };

  const uploadFiles = async (fileList) => {
    if (!fileList?.length) return;
    const fd = new FormData();
    Array.from(fileList).forEach(f => fd.append("files", f));
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/uploads`, { method: "POST", headers: auth, body: fd });
      const { json, raw } = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || raw || "อัปโหลดไฟล์ไม่สำเร็จ");
      const urls = json?.data || json || [];
      setMySub((s) => ({ ...(s||{status:"DRAFT",attachments:[],note:""}), attachments: [...(s?.attachments||[]), ...urls] }));
    } catch (e) {
      showToast(e.message || "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx) => {
    setMySub((s) => ({ ...s, attachments: s.attachments.filter((_, i) => i !== idx) }));
  };

  const saveDraft = async () => {
    if (!detail || !currentUserId) { showToast("ไม่พบรหัสผู้ใช้"); return; }
    setSavingSub(true);
    try {
      const payload = {
        studentId: currentUserId,
        attachments: mySub.attachments || [],
        note: mySub.note || "",
        status: "DRAFT",
      };

      // มาตรฐาน
      const putRes = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions`, {
        method: "PUT",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!putRes.ok) {
        // fallback: /me
        const meRes = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions/me`, {
          method: "PUT",
          headers: { ...auth, "X-User-Id": currentUserId, "Content-Type": "application/json" },
          body: JSON.stringify({ attachments: payload.attachments, note: payload.note, status: "DRAFT" })
        });
        const { json: mj, raw: mr } = await safeJson(meRes);
        if (!meRes.ok) throw new Error(mj?.message || mr || "บันทึกร่างไม่สำเร็จ");
      }

      showToast("บันทึกร่างแล้ว");
    } catch (e) {
      showToast(e.message || "บันทึกร่างไม่สำเร็จ");
    } finally {
      setSavingSub(false);
    }
  };

  const doSubmit = async () => {
    if (!detail || !currentUserId) { showToast("ไม่พบรหัสผู้ใช้"); return; }
    if ((mySub?.attachments?.length || 0) === 0) {
      showToast("กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์ก่อนส่ง");
      return;
    }
    if (!window.confirm("ยืนยันการส่งงาน?")) return;

    setSavingSub(true);
    try {
      // มาตรฐาน
      const res = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions/submit`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUserId,
          attachments: mySub.attachments,
          note: mySub.note
        })
      });

      if (!res.ok) {
        // fallback: /me
        const put = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions/me`, {
          method: "PUT",
          headers: { ...auth, "X-User-Id": currentUserId, "Content-Type": "application/json" },
          body: JSON.stringify({ attachments: mySub.attachments, note: mySub.note, status: "SUBMITTED" })
        });
        const { json, raw } = await safeJson(put);
        if (!put.ok) throw new Error(json?.message || raw || "ส่งงานไม่สำเร็จ");
      }

      setMySub((s) => ({ ...s, status: "SUBMITTED" }));
      showToast("ส่งงานเรียบร้อย");
    } catch (e) {
      showToast(e.message || "ส่งงานไม่สำเร็จ");
    } finally {
      setSavingSub(false);
    }
  };

  const doUnsubmit = async () => {
    if (!detail || !currentUserId) { showToast("ไม่พบรหัสผู้ใช้"); return; }
    if (!window.confirm("ต้องการยกเลิกการส่งใช่ไหม?")) return;

    setSavingSub(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions/unsubmit`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUserId })
      });

      if (!res.ok) {
        // fallback: /me
        const put = await fetch(`${API_BASE}/api/v1/assignments/${detail.id}/submissions/me`, {
          method: "PUT",
          headers: { ...auth, "X-User-Id": currentUserId, "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DRAFT" })
        });
        const { json, raw } = await safeJson(put);
        if (!put.ok) throw new Error(json?.message || raw || "ยกเลิกการส่งไม่สำเร็จ");
      }

      setMySub((s) => ({ ...s, status: "DRAFT" }));
      showToast("ยกเลิกการส่งแล้ว");
    } catch (e) {
      showToast(e.message || "ยกเลิกการส่งไม่สำเร็จ");
    } finally {
      setSavingSub(false);
    }
  };

  if (loading) return <div className="container py-3">กำลังโหลด…</div>;

  return (
    <div className="container py-4">
      {!!toast && (
        <div className="alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3 shadow" style={{zIndex:9999}}>
          {toast}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i> ย้อนกลับ
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h3 className="mb-2">{course?.title || course?.name || `Course ${courseId}`}</h3>
          <p className="text-muted mb-0">
            <i className="bi bi-journal-text me-2"></i> งานที่มอบหมายทั้งหมด
          </p>

          {sections.length > 1 && (
            <div className="mt-3">
              <label className="form-label fw-semibold">
                <i className="bi bi-collection me-2"></i>เลือก Section
              </label>
              <select className="form-select" value={activeSectionId ?? ""} onChange={(e)=>setActiveSectionId(Number(e.target.value))}>
                <option value="" disabled>เลือก Section</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    Section {s.sectionNo ?? s.id} {s.term ? `(${s.term})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {!activeSectionId && sections.length === 0 && (
        <div className="alert alert-warning">รายวิชานี้ยังไม่พบ Section ที่เกี่ยวข้องกับคุณ</div>
      )}

      <div className="row g-3">
        {activeSectionId && assignments.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i> ยังไม่มีงานที่มอบหมาย
            </div>
          </div>
        ) : (
          assignments.map((a) => (
            <div className="col-md-6 col-lg-4" key={a.id}>
              <div className="card h-100 shadow-sm assignment-card">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{a.title}</h5>
                  <p className="card-text text-muted small flex-grow-1">{a.description || "-"}</p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="text-muted">
                      <i className="bi bi-calendar3 me-1" />
                      {a.dueDate ? new Date(a.dueDate).toLocaleString("th-TH") : "-"}
                    </small>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(a)}>
                      รายละเอียด/ส่งงาน
                    </button>
                  </div>
                  {a.maxScore != null && (
                    <div className="mt-2 text-muted small">
                      คะแนนเต็ม: <strong>{a.maxScore}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal รายละเอียด + ส่งงาน */}
      {!!detail && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.45)" }}
          role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target.classList.contains("modal")) { setDetail(null); setMySub(null); } }}
          onKeyDown={(e) => { if (e.key === "Escape") { setDetail(null); setMySub(null); } }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-journal-text me-2"></i>{detail.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setDetail(null); setMySub(null); }} />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <div className="text-muted small mb-1">รายละเอียด</div>
                  <div className="p-3 bg-light rounded">{detail.description || "-"}</div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="text-muted small">กำหนดส่ง</div>
                    <div className="fw-semibold">
                      {detail.dueDate ? new Date(detail.dueDate).toLocaleString("th-TH") : "-"}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-muted small">คะแนนเต็ม</div>
                    <div className="fw-semibold">{detail.maxScore ?? "-"}</div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-muted small">สถานะของฉัน</div>
                    <div className={`fw-semibold ${mySub?.status === "SUBMITTED" ? "text-success" : "text-secondary"}`}>
                      {mySub?.status === "SUBMITTED" ? "ส่งแล้ว" : "ร่าง"}
                    </div>
                  </div>
                </div>

                {(mySub?.score != null || mySub?.feedback) && (
                  <div className="mb-3">
                    <div className="alert alert-success mb-2 py-2">
                      <div className="d-flex justify-content-between">
                        <div><strong>คะแนน:</strong> {mySub.score ?? "-"}</div>
                        <div className="small text-muted">{mySub.updatedAt ? new Date(mySub.updatedAt).toLocaleString("th-TH") : ""}</div>
                      </div>
                      {!!mySub.feedback && <div className="mt-2"><strong>Feedback:</strong> {mySub.feedback}</div>}
                    </div>
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label fw-semibold">ไฟล์งานของฉัน</label>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <label className="btn btn-outline-secondary mb-0">
                      <i className="bi bi-upload me-2"></i> เลือกไฟล์…
                      <input
                        type="file"
                        hidden multiple
                        disabled={uploading || mySub?.status === "SUBMITTED"}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files?.length) return;
                          uploadFiles(files).finally(() => { e.target.value = ""; });
                        }}
                      />
                    </label>
                    {uploading && <span className="small text-muted">กำลังอัปโหลด…</span>}
                  </div>

                  {!!mySub?.attachments?.length ? (
                    <ul className="list-group">
                      {mySub.attachments.map((u, i) => (
                        <li key={`${u}-${i}`} className="list-group-item d-flex justify-content-between align-items-center">
                          <a href={u} target="_blank" rel="noreferrer" className="text-truncate" style={{maxWidth:'75%'}}>{u}</a>
                          {mySub.status !== "SUBMITTED" && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeAttachment(i)}>
                              ลบ
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted small">ยังไม่มีไฟล์แนบ</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">โน้ต/คำอธิบายเพิ่มเติม</label>
                  <textarea
                    className="form-control" rows={3}
                    value={mySub?.note || ""}
                    onChange={(e) => setMySub((s) => ({ ...(s||{}), note: e.target.value }))}
                    disabled={mySub?.status === "SUBMITTED"}
                    placeholder="คำอธิบายสั้น ๆ เกี่ยวกับงานของฉัน…"
                  />
                </div>
              </div>

              <div className="modal-footer">
                {mySub?.status !== "SUBMITTED" ? (
                  <>
                    <button className="btn btn-light" onClick={() => { setDetail(null); setMySub(null); }} disabled={savingSub}>
                      ปิด
                    </button>
                    <button className="btn btn-outline-primary" onClick={saveDraft} disabled={savingSub}>
                      {savingSub ? "กำลังบันทึก…" : "บันทึกร่าง"}
                    </button>
                    <button className="btn btn-primary" onClick={doSubmit} disabled={savingSub || (mySub?.attachments?.length||0)===0}>
                      {savingSub ? "กำลังส่ง…" : "ส่งงาน"}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-light" onClick={() => { setDetail(null); setMySub(null); }}>
                      ปิด
                    </button>
                    <button className="btn btn-warning" onClick={doUnsubmit} disabled={savingSub}>
                      {savingSub ? "กำลังดำเนินการ…" : "ยกเลิกการส่ง"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.assignment-card .card-title { font-weight: 700; }`}</style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
    </div>
  );
}
