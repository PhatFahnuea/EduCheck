import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./checkin.css"; // ⬅️ ใช้ไฟล์ CSS ภายนอก

const API_BASE = import.meta?.env?.VITE_API_BASE ?? "";

export default function CheckinPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [inspectErr, setInspectErr] = useState("");
  const [sectionId, setSectionId] = useState(null);
  const [sectionCode, setSectionCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return 0;
    const diffMs = new Date(expiresAt).getTime() - now;
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [expiresAt, now]);

  const expired = secondsLeft <= 0;

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!token) {
        setInspectErr("ไม่พบโทเคนในลิงก์");
        setLoading(false);
        return;
      }
      setLoading(true);
      setInspectErr("");
      try {
        const res = await fetch(`${API_BASE}/api/v1/attendance/qr/inspect?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!ignore) {
          setSectionId(data.sectionId ?? null);
          setSectionCode(data.sectionCode ?? "");
          setExpiresAt(data.exp ?? null);
        }
      } catch (e) {
        if (!ignore) setInspectErr(e.message || "ตรวจสอบโทเคนไม่สำเร็จ");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    setSubmitOk(false);

    if (!fullName.trim()) return setSubmitErr("กรุณากรอกชื่อ-สกุล");
    if (!studentNumber.trim()) return setSubmitErr("กรุณากรอกรหัสนักศึกษา");
    if (expired) return setSubmitErr("คิวอาร์นี้หมดเวลาแล้ว");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/attendance/public/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          studentNumber: studentNumber.trim(),
          fullName: fullName.trim(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setSubmitOk(true);
    } catch (e) {
      setSubmitErr(e.message || "เช็คชื่อไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);
  const countdownLabel = useMemo(() => {
    const h = Math.floor(secondsLeft / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = secondsLeft % 60;
    return `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
  }, [secondsLeft]);

  return (
    <div className="checkin-wrap">
      <div className="checkin-card">
        <h1 className="checkin-title">เช็คชื่อเข้าคลาส</h1>

        {loading && <p>กำลังตรวจสอบลิงก์เช็คชื่อ...</p>}

        {!loading && inspectErr && (
          <div className="checkin-errorBox" role="alert">
            <strong>เกิดข้อผิดพลาด:</strong> {inspectErr}
            <div style={{ marginTop: 8 }}>โปรดติดต่อผู้สอนหรือขอสแกนใหม่</div>
          </div>
        )}

        {!loading && !inspectErr && (
          <>
            <div className="checkin-metaRow">
              <div className="checkin-meta">
                <div className="checkin-metaLabel">Section</div>
                <div className="checkin-metaValue">{sectionCode || sectionId || "-"}</div>
              </div>
              <div className="checkin-meta">
                <div className="checkin-metaLabel">เวลาที่เหลือ</div>
                <div className={`checkin-metaValue ${expired ? "checkin-danger" : "checkin-success"}`}>
                  {countdownLabel}{expired ? " (หมดเวลา)" : ""}
                </div>
              </div>
            </div>

            {submitOk ? (
              <div className="checkin-successBox">✅ บันทึกการเช็คชื่อเรียบร้อย ขอบคุณครับ/ค่ะ</div>
            ) : (
              <form onSubmit={onSubmit} className="checkin-form">
                <label className="checkin-label">
                  ชื่อ–สกุล
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="กรุณากรอกชื่อ-สกุลตามจริง"
                    className="checkin-input"
                    disabled={expired || submitting}
                  />
                </label>

                <label className="checkin-label">
                  รหัสนักศึกษา
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value.replace(/\s+/g, ""))}
                    placeholder="เช่น 6530xxxxxx"
                    className="checkin-input"
                    disabled={expired || submitting}
                    inputMode="numeric"
                  />
                </label>

                <label className="checkin-label">
                  Section
                  <input
                    type="text"
                    value={sectionCode || String(sectionId || "")}
                    className="checkin-input checkin-input--readonly"
                    disabled
                    readOnly
                  />
                </label>

                {submitErr && <div className="checkin-errorText">⚠️ {submitErr}</div>}

                <button
                  type="submit"
                  className={`checkin-btn ${expired || submitting ? "is-disabled" : ""}`}
                  disabled={expired || submitting}
                >
                  {submitting ? "กำลังบันทึก..." : "เช็คชื่อ"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
