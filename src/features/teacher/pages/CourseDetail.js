// src/features/teacher/pages/CourseDetail.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE as API_BASE_RAW } from "../../../lib/api";

const fallbackImg =
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop";

export default function CourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const API_BASE = useMemo(() => (API_BASE_RAW || "").replace(/\/+$/, ""), []);
    const auth = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : {}),
        [token]
    );

    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [sectionId, setSectionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const imgUrl = (img) => {
        if (!img) return fallbackImg;
        if (/^https?:\/\//i.test(img)) return img;
        const path = img.startsWith("/") ? img : `/${img}`;
        return `${API_BASE}${path}`;
    };

    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const res = await fetch(
                    `${API_BASE}/api/v1/courses/${courseId}/detail`,
                    { headers: auth, signal: ac.signal }
                );

                let data;
                try {
                    data = await res.json();
                } catch {
                    const text = await res.text();
                    throw new Error(text || `โหลดข้อมูลล้มเหลว (${res.status})`);
                }
                if (!res.ok)
                    throw new Error(data?.message || `โหลดข้อมูลล้มเหลว (${res.status})`);

                setCourse(data.course);
                setSections(data.sections || []);
                setSectionId(data.sections?.[0]?.id ?? null);
            } catch (e) {
                if (e.name !== "AbortError") setErr(e.message || "โหลดข้อมูลล้มเหลว");
            } finally {
                setLoading(false);
            }
        })();
        return () => ac.abort();
    }, [API_BASE, auth, courseId]);

    const [toast, setToast] = useState({ type: "", msg: "" });
    const toastTimer = useRef(null);
    const showToast = (type, msg) => {
        clearTimeout(toastTimer.current);
        setToast({ type, msg });
        toastTimer.current = setTimeout(() => setToast({ type: "", msg: "" }), 3000);
    };

    // ====== TA modal (คงเดิม) ======
    const [showTaModal, setShowTaModal] = useState(false);
    const [taForm, setTaForm] = useState({ email: "", username: "", password: "" });
    const [creatingTa, setCreatingTa] = useState(false);
    const openTaModal = () => setShowTaModal(true);
    const closeTaModal = () => {
        if (!creatingTa) {
            setShowTaModal(false);
            setTaForm({ email: "", username: "", password: "" });
        }
    };
    const onTaChange = (e) => {
        const { name, value } = e.target;
        setTaForm((f) => ({ ...f, [name]: value }));
    };

    const extractUserId = (obj) => {
        const d = obj?.data ?? obj;
        return d?.userId ?? d?.id ?? d?.user?.id ?? obj?.userId ?? obj?.id ?? null;
    };
    const parseJsonSafe = async (res) => {
        const text = await res.text();
        try {
            return { json: JSON.parse(text), raw: text };
        } catch {
            return { json: null, raw: text };
        }
    };
    const postJson = async (url, payload, extraHeaders = {}) => {
        const res = await fetch(url, {
            method: "POST",
            headers: { ...auth, "Content-Type": "application/json", ...extraHeaders },
            body: JSON.stringify(payload),
        });
        const { json, raw } = await parseJsonSafe(res);
        return { ok: res.ok, status: res.status, json, raw };
    };
    const createTaAccount = async ({ email, username, password }) => {
        const tryTa = await postJson(`${API_BASE}/api/v1/auth/register-ta`, {
            email,
            username,
            password,
        });
        if (tryTa.ok || tryTa.status !== 404) return tryTa;
        return postJson(`${API_BASE}/api/v1/auth/register`, {
            email,
            username,
            password,
            role: "TA",
        });
    };
    const confirmAndCreateTa = async () => {
        if (!sectionId) return alert("ยังไม่ได้เลือก Section");

        const email = taForm.email.trim();
        const username = taForm.username.trim();
        const password = taForm.password;

        if (!email || !username || !password) {
            return showToast("danger", "กรอก Email, Username และ Password ให้ครบ");
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return showToast("danger", "รูปแบบอีเมลไม่ถูกต้อง");
        }

        if (
            !window.confirm(
                `ยืนยันเพิ่ม TA ใหม่ให้กับ Section นี้?\n\nEmail: ${email}\nUsername: ${username}`
            )
        ) {
            return;
        }

        try {
            setCreatingTa(true);
            const reg = await createTaAccount({ email, username, password });
            if (!reg.ok) {
                if (reg.status === 409) throw new Error("Username หรือ Email ซ้ำ");
                if (reg.status === 400)
                    throw new Error(reg.json?.message || "ข้อมูลไม่ครบหรือไม่ถูกต้อง");
                if (reg.status === 403)
                    throw new Error(reg.json?.message || "ไม่ได้รับอนุญาตให้สร้าง TA");
                throw new Error(reg.json?.message || reg.raw || `Create TA failed (${reg.status})`);
            }
            const taId = extractUserId(reg.json);
            if (!taId) throw new Error("ไม่พบ userId หลังสร้าง TA");

            const assignRes = await fetch(
                `${API_BASE}/api/v1/sections/${sectionId}/assign-ta`,
                {
                    method: "POST",
                    headers: { ...auth, "Content-Type": "application/json" },
                    body: JSON.stringify({ taId, permissions: ["grade:read", "grade:write"] }),
                }
            );
            const { json: assignJson, raw: assignRaw } = await parseJsonSafe(assignRes);
            if (!assignRes.ok) throw new Error(assignJson?.message || assignRaw || "Assign TA failed");

            showToast("success", "เพิ่ม TA สำเร็จ");
            closeTaModal();
        } catch (e) {
            showToast("danger", e.message || "เพิ่ม TA ไม่สำเร็จ");
        } finally {
            setCreatingTa(false);
        }
    };

    // ====== Import students (คงเดิม) ======
    const [uploading, setUploading] = useState(false);
    const [lastImport, setLastImport] = useState(null);
    const downloadCsv = (filename, rows) => {
        const header = "row,reason\n";
        const body = (rows || [])
            .map((r) => `${r.row},${(r.reason || "").replace(/[\r\n,]/g, " ")}`)
            .join("\n");
        const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };
    const downloadTemplate = () => {
        const BOM = "\uFEFF";
        const csv = BOM + "studentNumber,fullname,email,username\n";
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_import_template.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const importStudents = async (file) => {
        try {
            if (!sectionId) return alert("ยังไม่ได้เลือก Section");
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                return showToast("danger", "ไฟล์ใหญ่เกินไป (จำกัด 10MB)");
            }
            const fd = new FormData();
            fd.append("file", file);
            setUploading(true);
            const res = await fetch(
                `${API_BASE}/api/v1/sections/${sectionId}/import-students`,
                {
                    method: "POST",
                    headers: auth,
                    body: fd,
                }
            );
            const text = await res.text();
            let json = null;
            try {
                json = JSON.parse(text);
            } catch { }
            if (!res.ok) {
                const msg = json?.message || text || "Import students failed";
                throw new Error(msg);
            }
            const data = json?.data || json;
            setLastImport(data || null);
            const created = data?.created ?? 0;
            const updated = data?.updated ?? 0;
            const skipped = data?.skipped ?? 0;
            showToast("success", `เพิ่มใหม่ ${created} | อัปเดต ${updated} | ข้าม ${skipped}`);
            const input = document.querySelector(
                'input[type="file"][accept=".xlsx,.xls,.csv"]'
            );
            if (input) input.value = "";
        } catch (e) {
            showToast("danger", e.message || "Import students failed");
        } finally {
            setUploading(false);
        }
    };

    // ====== Assignments / Attendance navigation (คงเดิม) ======
    const handleViewAssignments = () => {
        if (!sectionId) return showToast("danger", "กรุณาเลือก Section ก่อน");
        navigate(`/teacher/subject/${courseId}/assignments?section=${sectionId}`);
    };
    const handleViewAttendance = () => {
        if (!sectionId) {
            showToast("warning", "กรุณาเลือก Section ก่อน");
            return;
        }
        navigate(`/teacher/courses/${courseId}/sections/${sectionId}/attendance`);
    };

    // ====== NEW: สร้าง/แสดงคิวอาร์เช็กชื่อใน CourseDetail ======
    const [showQR, setShowQR] = useState(false);
    const [qrUrl, setQrUrl] = useState("");
    const [checkinLink, setCheckinLink] = useState("");
    const [qrNote, setQrNote] = useState("");
    const [qrDuration, setQrDuration] = useState(10); // นาที

    const genCheckin = () => {
        if (!sectionId) return showToast("warning", "กรุณาเลือก Section ก่อน");
        // สร้างค่า token ชั่วคราวฝั่งหน้าเว็บ (ถ้ามี backend session จริงค่อยเชื่อมต่อภายหลังได้)
        const token = Math.random().toString(36).slice(2, 10);
        const base = window.location.origin;
        const link = `${base}/attendance/checkin?course=${courseId}&section=${sectionId}&k=${token}&t=${qrDuration}`;
        setCheckinLink(link);

        // ใช้บริการสร้างรูป QR (ไม่ต้องติดตั้ง lib เพิ่ม)
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
            link
        )}`;
        setQrUrl(qrImg);
        setShowQR(true);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(checkinLink);
            showToast("success", "คัดลอกลิงก์แล้ว");
        } catch {
            showToast("danger", "คัดลอกลิงก์ไม่สำเร็จ");
        }
    };

    const downloadQR = () => {
        if (!qrUrl) return;
        const a = document.createElement("a");
        a.href = qrUrl;
        a.download = `checkin_qr_section_${sectionId}.png`;
        a.click();
    };

    if (loading) return <div className="container py-3">กำลังโหลด…</div>;
    if (err)
        return (
            <div className="container py-3">
                <div className="alert alert-danger">{err}</div>
            </div>
        );
    if (!course) return null;

    return (
        <div className="container py-4">
            {!!toast.msg && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`}
                    role="alert"
                    style={{ zIndex: 9999, minWidth: "300px" }}
                >
                    {toast.msg}
                </div>
            )}

            {/* Course Card */}
            <div
                className="card border-0 shadow-sm mb-4"
                style={{ borderRadius: "12px", overflow: "hidden" }}
            >
                <div className="row g-0">
                    <div className="col-md-5">
                        <div className="ratio ratio-16x9" style={{ minHeight: "350px" }}>
                            <img
                                src={imgUrl(course.img)}
                                alt={course.title || course.code}
                                className="object-fit-cover"
                                onError={(e) => {
                                    e.currentTarget.src = fallbackImg;
                                }}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </div>
                    </div>

                    <div className="col-md-7">
                        <div className="p-4">
                            <button
                                className="btn btn-sm btn-light mb-3 back-button"
                                onClick={() => navigate(-1)}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                ย้อนกลับ
                            </button>

                            <div className="mb-3">
                                <span className="badge bg-primary mb-2">{course.code}</span>
                                <h3 className="fw-bold mb-2">{course.title}</h3>
                                <p
                                    className="text-muted"
                                    style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                                >
                                    {course.description || "ไม่มีรายละเอียด"}
                                </p>
                            </div>

                            {/* Section Selector */}
                            <div className="mb-4 p-3 bg-light rounded">
                                <label className="form-label fw-semibold mb-2">
                                    <i className="bi bi-collection me-2"></i>เลือก Section
                                </label>
                                <select
                                    className="form-select"
                                    value={sectionId ?? ""}
                                    onChange={(e) => setSectionId(Number(e.target.value))}
                                >
                                    {sections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            Section {sec.sectionNo} ({sec.term})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex flex-column gap-2">
                                <h6 className="fw-semibold mb-2">จัดการคอร์ส</h6>

                                <div className="row g-2">
                                    <div className="col-md-6">
                                        <button
                                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                            onClick={handleViewAssignments}
                                            disabled={!sectionId}
                                        >
                                            <i className="bi bi-journal-text me-2"></i>
                                            ดูงานที่มอบหมาย
                                        </button>
                                    </div>

                                    <div className="d-flex justify-content-end mb-3">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => navigate(`/teacher/section/${sectionId}/exams/new`)}
                                            disabled={!sectionId}
                                        >
                                            <i className="bi bi-calendar2-week me-1" />
                                            นัดวันสอบ
                                        </button>
                                    </div>


                                    {/* NEW: ปุ่มสร้างคิวอาร์เช็กชื่อ */}
                                    <div className="col-md-6">
                                        <button
                                            className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center"
                                            onClick={genCheckin}
                                            disabled={!sectionId}
                                        >
                                            <i className="bi bi-qr-code me-2"></i>
                                            สร้างคิวอาร์เช็กชื่อ
                                        </button>
                                    </div>

                                    <div className="col-md-6">
                                        <button
                                            className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                                            onClick={openTaModal}
                                            disabled={!sectionId}
                                        >
                                            <i className="bi bi-person-plus me-2"></i>
                                            เพิ่ม TA
                                        </button>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center mb-0">
                                            <i className="bi bi-upload me-2"></i>
                                            {uploading ? "กำลังอัปโหลด…" : "นำเข้านักศึกษา"}
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                hidden
                                                disabled={!sectionId || uploading}
                                                onChange={(e) => importStudents(e.target.files?.[0])}
                                            />
                                        </label>
                                    </div>

                                    <div className="col-md-6">
                                        <button
                                            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                                            onClick={downloadTemplate}
                                        >
                                            <i className="bi bi-download me-2"></i>
                                            ดาวน์โหลดเทมเพลต CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Result (เดิม) */}
            {lastImport && (
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                    <div className="card-body">
                        <h5 className="card-title mb-3">
                            <i className="bi bi-info-circle me-2"></i>ผลการนำเข้าข้อมูล
                        </h5>

                        <div className="row text-center mb-3">
                            <div className="col-md-4">
                                <div className="p-3 bg-success bg-opacity-10 rounded">
                                    <h3 className="text-success mb-1">{lastImport.created ?? 0}</h3>
                                    <small className="text-muted">เพิ่มใหม่</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-3 bg-primary bg-opacity-10 rounded">
                                    <h3 className="text-primary mb-1">{lastImport.updated ?? 0}</h3>
                                    <small className="text-muted">อัปเดต</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-3 bg-warning bg-opacity-10 rounded">
                                    <h3 className="text-warning mb-1">{lastImport.skipped ?? 0}</h3>
                                    <small className="text-muted">ข้าม</small>
                                </div>
                            </div>
                        </div>

                        {!!lastImport.errors?.length && (
                            <div className="alert alert-danger">
                                <h6 className="alert-heading">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    พบข้อผิดพลาด ({lastImport.errors.length} รายการ)
                                </h6>
                                <ul className="mb-2">
                                    {lastImport.errors.slice(0, 5).map((e, i) => (
                                        <li key={i}>
                                            <small>
                                                แถว {e.row}: {e.reason}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                                {lastImport.errors.length > 5 && (
                                    <small className="text-muted">
                                        และอีก {lastImport.errors.length - 5} รายการ...
                                    </small>
                                )}
                                <button
                                    className="btn btn-sm btn-outline-danger mt-2"
                                    onClick={() =>
                                        downloadCsv(
                                            `import_errors_section_${sectionId}.csv`,
                                            lastImport.errors
                                        )
                                    }
                                >
                                    <i className="bi bi-download me-1"></i>
                                    ดาวน์โหลดรายการข้อผิดพลาด
                                </button>
                            </div>
                        )}

                        <div className="text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            ไฟล์ต้องมีคอลัมน์ <code>studentNumber</code> (สามารถเพิ่ม{" "}
                            <code>fullname</code> ได้)
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: เพิ่ม TA (เดิม) */}
            {showTaModal && (
                <div
                    className="modal fade show"
                    style={{ display: "block", background: "rgba(0,0,0,.5)" }}
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                        if (e.target.classList.contains("modal")) closeTaModal();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeTaModal();
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div
                            className="modal-content shadow-lg"
                            style={{ borderRadius: "12px", border: "none" }}
                        >
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                                    เพิ่มผู้ช่วยสอน (TA)
                                </h5>
                                <button className="btn-close" onClick={closeTaModal} disabled={creatingTa} />
                            </div>
                            <div className="modal-body px-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-envelope me-2"></i>อีเมล
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="form-control"
                                        placeholder="example@kkumail.com"
                                        value={taForm.email}
                                        onChange={onTaChange}
                                        disabled={creatingTa}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-person me-2"></i>ชื่อผู้ใช้
                                    </label>
                                    <input
                                        name="username"
                                        className="form-control"
                                        placeholder="username"
                                        value={taForm.username}
                                        onChange={onTaChange}
                                        disabled={creatingTa}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-lock me-2"></i>รหัสผ่าน
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="form-control"
                                        placeholder="••••••••"
                                        value={taForm.password}
                                        onChange={onTaChange}
                                        disabled={creatingTa}
                                    />
                                </div>
                                <div className="alert alert-info small mb-0">
                                    <i className="bi bi-info-circle me-2"></i>
                                    ระบบจะสร้างบัญชีผู้ใช้ใหม่ด้วยสิทธิ์ Teaching Assistant (TA) และเชื่อมเข้ากับ
                                    Section ที่เลือกโดยอัตโนมัติ
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-light" onClick={closeTaModal} disabled={creatingTa}>
                                    ยกเลิก
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmAndCreateTa}
                                    disabled={creatingTa}
                                >
                                    {creatingTa ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            กำลังเพิ่ม…
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-2"></i>ยืนยันเพิ่ม
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW Modal: แสดง QR สำหรับเช็กชื่อ */}
            {showQR && (
                <div
                    className="modal fade show"
                    style={{ display: "block", background: "rgba(0,0,0,.5)" }}
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                        if (e.target.classList.contains("modal")) setShowQR(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setShowQR(false);
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg" style={{ borderRadius: 12, border: "none" }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-qr-code me-2"></i>คิวอาร์เช็กชื่อ
                                </h5>
                                <button className="btn-close" onClick={() => setShowQR(false)} />
                            </div>

                            <div className="modal-body">
                                <div className="mb-3 d-flex gap-2">
                                    <div className="flex-grow-1">
                                        <label className="form-label fw-semibold">หัวข้อ/หมายเหตุ (ถ้ามี)</label>
                                        <input
                                            className="form-control"
                                            placeholder="เช่น สัปดาห์ที่ 5 - ห้องเรียน"
                                            value={qrNote}
                                            onChange={(e) => setQrNote(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ width: 140 }}>
                                        <label className="form-label fw-semibold">หมดอายุ (นาที)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="form-control"
                                            value={qrDuration}
                                            onChange={(e) => setQrDuration(Number(e.target.value || 1))}
                                        />
                                    </div>
                                </div>

                                <div className="text-center my-3">
                                    {qrUrl ? (
                                        <img
                                            src={qrUrl}
                                            alt="QR"
                                            style={{ width: 320, height: 320, borderRadius: 8 }}
                                            className="shadow-sm"
                                        />
                                    ) : (
                                        <div className="text-muted">ยังไม่ได้สร้างคิวอาร์</div>
                                    )}
                                </div>

                                <div className="bg-light rounded p-2 small">
                                    <div className="text-muted mb-1">ลิงก์เช็กชื่อ</div>
                                    <div
                                        className="text-break"
                                        style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}
                                    >
                                        {checkinLink}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={copyLink} disabled={!qrUrl}>
                                    คัดลอกลิงก์
                                </button>
                                <button className="btn btn-outline-dark" onClick={downloadQR} disabled={!qrUrl}>
                                    ดาวน์โหลด QR
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={genCheckin}
                                    disabled={!sectionId}
                                    title="สร้างใหม่/รีเฟรชคิวอาร์"
                                >
                                    <i className="bi bi-arrow-repeat me-2"></i>สร้าง/รีเฟรชคิวอาร์
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .object-fit-cover { object-fit: cover; }
        .fw-semibold { font-weight: 600; }
        .btn { transition: all .3s ease; }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,.15); }
        .card { transition: all .3s ease; }
        .badge { font-size: .85rem; padding: .4em .8em; }
        .back-button { display:inline-flex;align-items:center;font-weight:500;border:1px solid #dee2e6;background:#fff;color:#495057;padding:.375rem .75rem;border-radius:8px;transition:all .3s ease; }
        .back-button:hover { background:#f8f9fa;border-color:#adb5bd;color:#212529;transform:translateX(-3px);box-shadow:0 2px 8px rgba(0,0,0,.1);}
        .back-button i{ transition: transform .3s ease;}
        .back-button:hover i{ transform: translateX(-2px); }
      `}</style>

            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
            />
        </div>
    );
}
