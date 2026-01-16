// src/features/teacher/pages/ExamCreate.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

export default function ExamCreate() {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const API_BASE = useMemo(() => (API_BASE_RAW || "").replace(/\/+$/, ""), []);
  const auth = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const defaultInputDate = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(9, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: "Midterm Exam",
    description: "",
    examAt: defaultInputDate(),
    durationMinutes: 90,
    location: "TBA",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "durationMinutes" ? Number(value) : value }));
  };

  

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.examAt) {
      setErr("กรุณาเลือกวัน-เวลาเริ่มสอบ");
      return;
    }

    const payload = {
      title: (form.title || "").trim() || "Exam",
      description: form.description || "",
      examAt: new Date(form.examAt).toISOString(),
      durationMinutes: Number(form.durationMinutes) || 90,
      location: form.location || "TBA",
    };

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/sections/${sectionId}/exams`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}

      if (!res.ok) throw new Error(json?.message || text || "บันทึกตารางสอบไม่สำเร็จ");

      navigate("/teacher/home", {
        replace: true,
        state: { flashExam: json?.data || json },
      });
    } catch (e2) {
      setErr(e2.message || "บันทึกตารางสอบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2" />
          ย้อนกลับ
        </button>
        <h4 className="mb-0">
          <i className="bi bi-calendar2-week me-2" />
          นัดวันสอบ (Section ID: {sectionId})
        </h4>
        <div style={{ width: 120 }} />
      </div>

      <form className="card p-3 shadow-sm" onSubmit={onSubmit}>
        {err && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2" />
            {err}
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">ชื่อการสอบ</label>
            <input
              name="title"
              className="form-control"
              value={form.title}
              onChange={onChange}
              placeholder="Midterm / Final / Quiz"
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">วัน-เวลาเริ่มสอบ</label>
            <input
              type="datetime-local"
              name="examAt"
              className="form-control"
              value={form.examAt}
              onChange={onChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">ระยะเวลา (นาที)</label>
            <input
              type="number"
              name="durationMinutes"
              min="10"
              step="5"
              className="form-control"
              value={form.durationMinutes}
              onChange={onChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">สถานที่</label>
            <input
              name="location"
              className="form-control"
              value={form.location}
              onChange={onChange}
              placeholder="เช่น SC-301 หรือ Online"
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">รายละเอียด</label>
            <textarea
              name="description"
              rows={3}
              className="form-control"
              value={form.description}
              onChange={onChange}
              placeholder="เงื่อนไข/อุปกรณ์/รูปแบบข้อสอบ ฯลฯ"
            />
          </div>
        </div>

        <div className="mt-4 d-flex gap-2">
          <button type="button" className="btn btn-light" onClick={() => navigate(-1)} disabled={saving}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึกนัดหมาย"}
          </button>
        </div>
      </form>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
    </div>
  );
}
