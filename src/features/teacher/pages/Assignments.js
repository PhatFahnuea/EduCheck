// src/features/teacher/pages/Assignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

export default function Assignments() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const API_BASE = useMemo(() => (API_BASE_RAW || "").replace(/\/+$/, ""), []);
  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const sectionId = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const v = q.get("section");
    return v ? Number(v) : null;
  }, [location.search]);

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignError, setAssignError] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const defaultDue = useMemo(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d;
  }, []);

  const toLocalInputValue = (dateObj) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
      dateObj.getDate()
    )}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: toLocalInputValue(defaultDue),
    maxScore: 100,
    links: [],
    attachments: [],
  });
  const [linkInput, setLinkInput] = useState("");

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return { json: JSON.parse(text), raw: text };
    } catch {
      return { json: null, raw: text };
    }
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "maxScore" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const addLink = () => {
    const v = (linkInput || "").trim();
    if (!v) return;
    setForm((f) => ({ ...f, links: [...(f.links || []), v] }));
    setLinkInput("");
  };

  const removeLink = (idx) => {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== idx) }));
  };

  const removeAttachment = (idx) => {
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));
  };

  useEffect(() => {
    if (!sectionId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, sectionId]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    setAssignError("");

    try {
      const courseRes = await fetch(`${API_BASE}/api/v1/courses/${courseId}`, { headers: auth });
      const { json: courseJson } = await safeJson(courseRes);
      if (!courseRes.ok) {
        throw new Error(courseJson?.message || `โหลดคอร์สไม่สำเร็จ (${courseRes.status})`);
      }
      setCourse(courseJson?.data || courseJson);
    } catch (e) {
      setError(e.message || "โหลดคอร์สไม่สำเร็จ");
    }

    try {
      const assignRes = await fetch(`${API_BASE}/api/v1/sections/${sectionId}/assignments`, {
        headers: auth,
      });
      const { json: assignJson } = await safeJson(assignRes);

      if (!assignRes.ok) {
        setAssignments([]);
        setAssignError(assignJson?.message || `โหลดงานไม่สำเร็จ (${assignRes.status})`);
      } else {
        const payload = assignJson?.data ?? assignJson;
        const list =
          (Array.isArray(payload?.assignments) && payload.assignments) ||
          (Array.isArray(payload) && payload) ||
          [];
        setAssignments(list);
      }
    } catch (e) {
      setAssignments([]);
      setAssignError(e.message || "โหลดงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ===== Modal Controls =====
  const openCreateModal = () => {
    setEditingAssignment(null);
    setForm({
      title: "",
      description: "",
      dueDate: toLocalInputValue(defaultDue),
      maxScore: 100,
      links: [],
      attachments: [],
    });
    setLinkInput("");
    setAssignError("");
    setShowModal(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title || "",
      description: assignment.description || "",
      dueDate: assignment.dueDate ? toLocalInputValue(new Date(assignment.dueDate)) : toLocalInputValue(defaultDue),
      maxScore: assignment.maxScore ?? 100,
      links: assignment.links || [],
      attachments: assignment.attachments || [],
    });
    setLinkInput("");
    setAssignError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditingAssignment(null);
    }
  };

  const openDetailModal = (assignment) => {
    setViewingAssignment(assignment);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewingAssignment(null);
  };

  // ===== Upload Files =====
  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const fd = new FormData();
    Array.from(fileList).forEach((f) => fd.append("files", f));
    const res = await fetch(`${API_BASE}/api/v1/uploads`, {
      method: "POST",
      headers: auth,
      body: fd,
    });
    const { json, raw } = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || raw || "อัปโหลดไฟล์ไม่สำเร็จ");
    const urls = json?.data || json || [];
    if (!Array.isArray(urls)) throw new Error("รูปแบบผลลัพธ์อัปโหลดไม่ถูกต้อง");
    setForm((f) => ({ ...f, attachments: [...(f.attachments || []), ...urls] }));
  };

  // ===== Submit Create/Edit =====
  const submitForm = async (e) => {
    e?.preventDefault();
    if (!sectionId) {
      setAssignError("ไม่พบ Section");
      return;
    }
    if (!form.title.trim()) {
      setAssignError("กรุณากรอกชื่อชิ้นงาน");
      return;
    }
    if (!form.dueDate) {
      setAssignError("กรุณาเลือกวัน/เวลาส่ง");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      dueDate: new Date(form.dueDate).toISOString(),
      maxScore: form.maxScore === "" ? null : Number(form.maxScore),
      links: form.links || [],
      attachments: form.attachments || [],
    };

    try {
      setSaving(true);
      setAssignError("");

      const url = editingAssignment
        ? `${API_BASE}/api/v1/assignments/${editingAssignment.id}`
        : `${API_BASE}/api/v1/sections/${sectionId}/assignments`;

      const method = editingAssignment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { json, raw } = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || raw || "บันทึกงานไม่สำเร็จ");

      await loadData();
      setShowModal(false);
      setEditingAssignment(null);
    } catch (err) {
      setAssignError(err.message || "เกิดข้อผิดพลาดขณะบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // ===== Delete Assignment =====
  const handleDelete = async (assignment) => {
    if (!window.confirm(`ยืนยันการลบงาน "${assignment.title}"?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/v1/assignments/${assignment.id}`, {
        method: "DELETE",
        headers: auth,
      });

      const { json, raw } = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || raw || "ลบงานไม่สำเร็จ");

      await loadData();
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดขณะลบงาน");
    } finally {
      setDeleting(false);
    }
  };

    React.useEffect(() => {
  const lock = showModal || showDetailModal;
  if (lock) {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }
}, [showModal, showDetailModal]);
  // ===== Render =====
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
      
    );
  }



  return (
    <div className="assignments-page">
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            className="btn btn-outline-secondary btn-back"
            onClick={() => navigate(`/teacher/subject/${courseId}`)}
          >
            <i className="bi bi-arrow-left me-2" />
            ย้อนกลับ
          </button>

          <button
            className="btn btn-primary btn-add"
            onClick={openCreateModal}
            disabled={!sectionId}
          >
            <i className="bi bi-plus-circle me-2" />
            เพิ่มงานใหม่
          </button>
        </div>

        {/* Course Header Card */}
        <div className="card course-header-card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div>
                <p className="text-muted mb-0">
                  <i className="bi bi-stack me-2" />
                  งานที่มอบหมายทั้งหมด ({assignments.length})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {!sectionId && (
          <div className="alert alert-warning alert-dismissible fade show">
            <i className="bi bi-exclamation-triangle me-2" />
            ไม่พบ Section (URL ควรมี parameter ?section=&lt;ID&gt;)
          </div>
        )}

        {assignError && (
          <div className="alert alert-warning alert-dismissible fade show">
            <i className="bi bi-exclamation-circle me-2" />
            {assignError}
          </div>
        )}

        {/* Assignments Grid */}
        <div className="row g-4">
          {assignments.length === 0 ? (
            <div className="col-12">
              <div className="empty-state card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-journal-x display-1 text-muted mb-3"></i>
                  <h5 className="text-muted mb-2">ยังไม่มีงานที่มอบหมาย</h5>
                  <p className="text-muted mb-4">เริ่มสร้างงานแรกเพื่อมอบหมายให้นักศึกษา</p>
                  <button className="btn btn-primary" onClick={openCreateModal} disabled={!sectionId}>
                    <i className="bi bi-plus-circle me-2" />
                    สร้างงานแรก
                  </button>
                </div>
              </div>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="col-md-6 col-lg-4">
                <div className="card assignment-card h-100 border-0 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    {/* Title */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title mb-0 flex-grow-1">{assignment.title}</h5>
                      <span className="badge bg-primary ms-2">งาน</span>
                    </div>

                    {/* Description */}
                    <p className="card-text text-muted flex-grow-1 assignment-description">
                      {assignment.description || "ไม่มีรายละเอียด"}
                    </p>

                    {/* Meta Info */}
                    <div className="assignment-meta mb-3">
                      <div className="meta-item">
                        <i className="bi bi-calendar3 me-2" />
                        <span className="text-muted small">
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>

                      {assignment.maxScore != null && (
                        <div className="meta-item">
                          <i className="bi bi-trophy me-2" />
                          <span className="text-muted small">
                            คะแนนเต็ม: <strong>{assignment.maxScore}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-primary flex-grow-1"
                        onClick={() => openDetailModal(assignment)}
                      >
                        <i className="bi bi-eye me-1" />
                        ดูรายละเอียด
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openEditModal(assignment)}
                        disabled={deleting}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(assignment)}
                        disabled={deleting}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Create/Edit Assignment */}
      {showModal && (
        <div
          className="modal fade show modal-overlay"
          // ทำให้ overlay เลื่อนตามได้ และล็อคความสูงไม่เกินจอ
          style={{ display: "block", background: "rgba(0,0,0,.45)", overflowY: "auto" }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) closeModal();
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ maxHeight: "calc(100vh - 2rem)" }}>
              <form onSubmit={submitForm}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className={`bi ${editingAssignment ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} />
                    {editingAssignment ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} />
                </div>

                {/* จุดนี้จะเป็นส่วนที่เลื่อน */}
                <div className="modal-body" style={{ overflowY: "auto" }}>
                  {assignError && (
                    <div className="alert alert-danger py-2 mb-3">
                      <i className="bi bi-exclamation-triangle me-2" />
                      {assignError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      ชื่อชิ้นงาน <span className="text-danger">*</span>
                    </label>
                    <input
                      name="title"
                      className="form-control"
                      placeholder="เช่น งานกลุ่มบทที่ 1"
                      value={form.title}
                      onChange={onFormChange}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">รายละเอียด</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows={4}
                      placeholder="คำอธิบาย/เกณฑ์การให้คะแนน…"
                      value={form.description}
                      onChange={onFormChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">
                        กำหนดส่ง <span className="text-danger">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        className="form-control"
                        value={form.dueDate}
                        onChange={onFormChange}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">คะแนนเต็ม</label>
                      <input
                        type="number"
                        name="maxScore"
                        min="0"
                        step="0.5"
                        className="form-control"
                        value={form.maxScore}
                        onChange={onFormChange}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Links */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-link-45deg me-2" />
                      ลิงก์อ้างอิง
                    </label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        placeholder="https://..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        disabled={saving}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={addLink}
                        disabled={saving || !linkInput.trim()}
                      >
                        <i className="bi bi-plus-lg me-1" />
                        เพิ่ม
                      </button>
                    </div>
                    {!!form.links?.length && (
                      <div className="list-group list-group-flush mt-2">
                        {form.links.map((lnk, i) => (
                          <div
                            key={`${lnk}-${i}`}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <a href={lnk} target="_blank" rel="noreferrer" className="text-truncate">
                              <i className="bi bi-link-45deg me-1" />
                              {lnk}
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeLink(i)}
                              disabled={saving}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-paperclip me-2" />
                      ไฟล์ประกอบ
                    </label>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <label className="btn btn-outline-secondary mb-0">
                        <i className="bi bi-upload me-2" />
                        เลือกไฟล์…
                        <input
                          type="file"
                          hidden
                          multiple
                          disabled={saving}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files?.length) return;
                            try {
                              setSaving(true);
                              await uploadFiles(files);
                            } catch (err) {
                              setAssignError(err.message || "อัปโหลดไฟล์ไม่สำเร็จ");
                            } finally {
                              setSaving(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                      <small className="text-muted">รองรับหลายไฟล์</small>
                    </div>

                    {!!form.attachments?.length && (
                      <div className="list-group list-group-flush">
                        {form.attachments.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <a href={url} target="_blank" rel="noreferrer" className="text-truncate">
                              <i className="bi bi-file-earmark me-1" />
                              {url.split('/').pop()}
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeAttachment(i)}
                              disabled={saving}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="alert alert-info small mb-0">
                    <i className="bi bi-info-circle me-2" />
                    ระบบจะบันทึกงานลงใน Section ID: <code>{sectionId}</code>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal} disabled={saving}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        กำลังบันทึก…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2" />
                        {editingAssignment ? 'บันทึกการแก้ไข' : 'บันทึก'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Detail */}
      {showDetailModal && viewingAssignment && (
        <div
          className="modal fade show modal-overlay"
          style={{ display: "block", background: "rgba(0,0,0,.45)", overflowY: "auto" }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) closeDetailModal();
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ maxHeight: "calc(100vh - 2rem)" }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-journal-text me-2" />
                  รายละเอียดงาน
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeDetailModal}
                />
              </div>

              <div className="modal-body" style={{ overflowY: "auto" }}>
                {/* … (เหมือนเดิมทั้งหมด) … */}
                {/* คงเนื้อหาใน modal-body ของคุณไว้ */}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-warning" onClick={() => {
                  closeDetailModal();
                  openEditModal(viewingAssignment);
                }}>
                  <i className="bi bi-pencil me-2" />
                  แก้ไข
                </button>
                <button className="btn btn-outline-danger" onClick={() => {
                  closeDetailModal();
                  handleDelete(viewingAssignment);
                }}>
                  <i className="bi bi-trash me-2" />
                  ลบ
                </button>
                <button className="btn btn-secondary" onClick={closeDetailModal}>
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force scrolling rules in case of other CSS overrides */}
      <style>{`
        /* กันกรณีมี CSS อื่นไป override ของ bootstrap */
        .modal-dialog-scrollable .modal-body { overflow-y: auto; }
        .modal-content { display: flex; flex-direction: column; }
        .modal-header, .modal-footer { flex-shrink: 0; }
        .modal-body { flex: 1 1 auto; }
      `}</style>

      <style>{`
  /* ขนาดโมดัลโดยรวม */
  .modal-overlay {
    background: rgba(0,0,0,.45);
  }
  .modal-dialog.modal-lg {
    max-width: 900px;
  }
  .modal-content {
    /* ใช้ความสูงเต็มหน้าจอ - เว้น margin รอบๆ */
    max-height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
  }
  /* ให้ส่วน body เป็นตัวสกรอล */
  .modal-content .modal-body {
    overflow: auto;
  }
  /* ให้ footer ติดล่างเสมอ และมีพื้นหลังทับเงาเนื้อหาที่สกรอลมา */
  .modal-content .modal-footer {
    position: sticky;
    bottom: 0;
    background: #fff;
    z-index: 1;
    box-shadow: 0 -6px 12px rgba(2,6,23,.06);
  }

  /* ป้องกันจอมือถือ/แท็บเล็ตที่มีแถบ address bar ใช้ 100dvh เมื่อรองรับ */
  @supports (height: 100dvh) {
    .modal-content { max-height: calc(100dvh - 4rem); }
  }
`}</style>


      {/* Bootstrap Icons */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </div>
  );
}
