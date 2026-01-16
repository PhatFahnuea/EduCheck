import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../../app/config";

export default function TeacherAttendance() {
  const [sectionId, setSectionId] = useState("1");
  const [ttlSec, setTtlSec] = useState("3600");
  const [imgUrl, setImgUrl] = useState("");
  const [token, setToken] = useState("");
  const [checkinUrl, setCheckinUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [err, setErr] = useState("");
  const [left, setLeft] = useState("--");
  const timerRef = useRef(null);

  const profToken = useMemo(() => localStorage.getItem("profToken") || "", []);

  const loadQR = async () => {
    setErr("");
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/attendance/qr/generate/${sectionId}?link=true&ttlSec=${ttlSec}`,
        { headers: profToken ? { Authorization: `Bearer ${profToken}` } : {} }
      );
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      setImgUrl(URL.createObjectURL(blob));
      setToken(res.headers.get("X-Token") || "");
      setCheckinUrl(res.headers.get("X-CheckinUrl") || "");
      setExpiresAt(res.headers.get("X-ExpiresAt") || "");
    } catch (e) {
      setErr(e.message || "Load QR failed");
    }
  };

  useEffect(() => { loadQR(); }, []); 

  useEffect(() => {
    if (!expiresAt) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const exp = new Date(expiresAt);
    timerRef.current = setInterval(() => {
      const sec = Math.max(0, Math.floor((exp - new Date()) / 1000));
      setLeft(String(sec));
      if (sec <= 0) {
        clearInterval(timerRef.current);
        loadQR(); 
      }
    }, 250);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [expiresAt]);

  return (
    <div className="container py-3">
      <h4 className="mb-3">สร้าง QR สำหรับเช็กชื่อ (ห้องเรียน)</h4>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-auto">
          <label className="small text-muted">Section ID</label>
          <input className="form-control" value={sectionId}
                 onChange={e=>setSectionId(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="small text-muted">TTL (วินาที)</label>
          <input className="form-control" value={ttlSec}
                 onChange={e=>setTtlSec(e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" onClick={loadQR}>Regenerate</button>
        </div>
        <div className="col-auto">
          <span className="badge bg-light text-dark">หมดอายุใน {left}s</span>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">{String(err)}</div>}

      <div className="d-flex gap-3 align-items-start">
        <img src={imgUrl} alt="QR"
             style={{width: 280, height: 280, borderRadius: 8, border: "1px solid #eee"}} />
        <div className="small text-muted" style={{wordBreak: "break-word"}}>
          <div><b>Token:</b> {token || "-"}</div>
          <div><b>URL:</b> {checkinUrl || "-"}</div>
          <div><b>Expires At:</b> {expiresAt ? new Date(expiresAt).toLocaleString() : "-"}</div>
        </div>
      </div>

      <p className="text-muted mt-3 mb-0">
        * ต้องมี JWT ของอาจารย์ใน <code>localStorage.profToken</code> เพื่อเรียก <code>/qr/generate</code>
      </p>
    </div>
  );
}
