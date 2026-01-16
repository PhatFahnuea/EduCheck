// src/features/teacher/pages/AddCourse.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../lib/api";

const DAY_OPTIONS = [
  { key: "MONDAY", label: "จันทร์" },
  { key: "TUESDAY", label: "อังคาร" },
  { key: "WEDNESDAY", label: "พุธ" },
  { key: "THURSDAY", label: "พฤหัสฯ" },
  { key: "FRIDAY", label: "ศุกร์" },
  { key: "SATURDAY", label: "เสาร์" },
  { key: "SUNDAY", label: "อาทิตย์" },
];

export default function AddCourse() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    imageFile: null,         // ไฟล์รูปปก
    // ข้อมูล section แรก
    sectionNo: 1,
    term: "1/2025",
    startDate: "",           // YYYY-MM-DD
    endDate: "",             // YYYY-MM-DD
    schedules: [],           // [{dayOfWeek,startTime,endTime,location}]
  });

  const onChange = (e) => {
    const { name, value, files, type } = e.target;
    if (name === "imageFile") {
      setForm((f) => ({ ...f, imageFile: files?.[0] || null }));
    } else if (type === "number") {
      setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const addSchedule = () => {
    setForm((f) => ({
      ...f,
      schedules: [
        ...f.schedules,
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:30", location: "" },
      ],
    }));
  };

  const updateSchedule = (idx, patch) => {
    setForm((f) => {
      const next = f.schedules.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...f, schedules: next };
    });
  };

  const removeSchedule = (idx) => {
    setForm((f) => ({ ...f, schedules: f.schedules.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    if (!form.code.trim() || !form.title.trim()) return "กรุณากรอก Subject Code และ Subject Name";
    if (!form.sectionNo) return "กรุณาระบุ Section No";
    if (!form.term.trim()) return "กรุณาระบุภาค/ปี (Term)";
    if (!form.startDate) return "กรุณาเลือกวันเริ่มสอน";
    if (!form.endDate) return "กรุณาเลือกวันสิ้นสุดการสอน";
    if (new Date(form.startDate) > new Date(form.endDate))
      return "วันเริ่มต้องไม่หลังวันสิ้นสุด";
    for (const s of form.schedules) {
      if (!s.startTime || !s.endTime) return "กรุณากรอกเวลาในตารางสอนให้ครบ";
      if (s.startTime >= s.endTime) return "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด";
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const v = validate();
    if (v) { setErr(v); return; }

    try {
      setSaving(true);

      // 1) สร้าง Course (multipart/form-data)
      const fd = new FormData();
      fd.append("code", form.code.trim());
      fd.append("title", form.title.trim());
      fd.append("description", form.description || "");
      if (form.imageFile) fd.append("img", form.imageFile); // field = 'img'
      // เผื่อแบ็กเอนด์รองรับวันที่ที่ระดับ course
      if (form.startDate) fd.append("startDate", form.startDate);
      if (form.endDate) fd.append("endDate", form.endDate);

      const res = await fetch(`${API_BASE}/api/v1/courses`, {
        method: "POST",
        headers: auth, // อย่าตั้ง Content-Type เอง
        body: fd,
      });

      const resText = await res.text();
      let resJson = safeJson(resText);

      if (!res.ok) {
        const msg =
          resJson?.message ||
          (res.status === 409 ? "Subject Code ซ้ำ" : "Create course failed");
        throw new Error(msg);
      }

      const courseId = resJson?.id ?? resJson?.data?.id;
      if (!courseId) throw new Error("ไม่พบ courseId ในคำตอบของเซิร์ฟเวอร์");

      // 2) สร้าง Section แรก (JSON) พร้อมช่วงวันที่และตารางเวลา
      const sPayload = {
        sectionNo: Number(form.sectionNo) || 1,
        term: form.term,
        startDate: form.startDate,  // YYYY-MM-DD
        endDate: form.endDate,      // YYYY-MM-DD
        schedules: form.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,   // MONDAY..SUNDAY
          startTime: s.startTime,   // HH:mm
          endTime: s.endTime,       // HH:mm
          location: s.location?.trim() || null,
        })),
      };

      const resSec = await fetch(`${API_BASE}/api/v1/courses/${courseId}/sections`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(sPayload),
      });

      const secText = await resSec.text();
      const secJson = safeJson(secText);

      if (!resSec.ok) {
        const msg = secJson?.message || "Create section failed";
        throw new Error(msg);
      }

      navigate("/teacher/subject", { replace: true });
    } catch (e2) {
      setErr(e2.message || "สร้างรายวิชาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4>Create Course</h4>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          ย้อนกลับ
        </button>
      </div>

      <form className="card p-3 shadow-sm" onSubmit={onSubmit}>
        {/* Subject Code / Name */}
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Subject Code</label>
            <input
              name="code"
              className="form-control"
              value={form.code}
              onChange={onChange}
              required
            />
          </div>
          <div className="col-md-8">
            <label className="form-label">Subject Name</label>
            <input
              name="title"
              className="form-control"
              value={form.title}
              onChange={onChange}
              required
            />
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-control"
              rows={4}
              value={form.description}
              onChange={onChange}
              placeholder="คำอธิบายรายวิชา"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Cover Image (file)</label>
            <div className="input-group">
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                className="form-control"
                onChange={onChange}
              />
              <span className="input-group-text" style={{ minWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                {form.imageFile ? form.imageFile.name : "—"}
              </span>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        {/* Initial Section */}
        <div className="row g-3">
          <div className="col-12">
            <div className="fw-bold">Initial Section</div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Section No</label>
            <input
              type="number"
              min="1"
              name="sectionNo"
              className="form-control"
              value={form.sectionNo}
              onChange={onChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Term</label>
            <input
              name="term"
              className="form-control"
              value={form.term}
              onChange={onChange}
              placeholder="เช่น 1/2025"
              required
            />
          </div>

          {/* ช่วงวันที่สอน */}
          <div className="col-md-3">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              name="startDate"
              className="form-control"
              value={form.startDate}
              onChange={onChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              name="endDate"
              className="form-control"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {/* ตารางเวลาเรียนรายสัปดาห์ */}
        <hr className="my-4" />
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="fw-bold">Weekly Schedule</div>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSchedule}>
            + Add Slot
          </button>
        </div>

        {form.schedules.length === 0 && (
          <div className="text-muted small mb-2">ยังไม่มีช่วงเวลา กด “Add Slot” เพื่อเพิ่ม</div>
        )}

        {form.schedules.map((s, i) => (
          <div key={i} className="row g-2 align-items-end mb-2">
            <div className="col-md-3">
              <label className="form-label">Day</label>
              <select
                className="form-select"
                value={s.dayOfWeek}
                onChange={(e) => updateSchedule(i, { dayOfWeek: e.target.value })}
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Start</label>
              <input
                type="time"
                className="form-control"
                value={s.startTime}
                onChange={(e) => updateSchedule(i, { startTime: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">End</label>
              <input
                type="time"
                className="form-control"
                value={s.endTime}
                min={s.startTime || undefined}
                onChange={(e) => updateSchedule(i, { endTime: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Location (optional)</label>
              <input
                className="form-control"
                value={s.location || ""}
                onChange={(e) => updateSchedule(i, { location: e.target.value })}
              />
            </div>
            <div className="col-md-1 text-end">
              <button type="button" className="btn btn-outline-danger" onClick={() => removeSchedule(i)}>
                ลบ
              </button>
            </div>
          </div>
        ))}

        <div className="mt-4 d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/teacher/subject")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
