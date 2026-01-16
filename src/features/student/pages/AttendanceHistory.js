import React, { useEffect, useState } from "react";
import "./AttendanceHistory.css";
import { getAttendanceHistory } from '../../../services/studentApi';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getAttendanceHistory();
      setRecords(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="content-wrap">
        <h4 className="mb-3">Attendance History</h4>
        <p className="text-muted">Loading attendance records…</p>
      </div>
    );
  }

  return (
    <div className="content-wrap">
      <h4 className="mb-3">Attendance History</h4>

      {records.length === 0 ? (
        <div className="text-muted">No attendance records found.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {records.map((r, index) => (
            <div key={index} className="card shadow-sm p-3 rounded-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-semibold">{r.date}</div>
                  <div className="text-muted small">{r.subject}</div>
                  <span
                    className={`badge px-3 py-2 rounded-pill ${
                      r.status === "Present"
                        ? "bg-success-subtle text-success"
                        : r.status === "Late"
                        ? "bg-warning-subtle text-warning"
                        : "bg-danger-subtle text-danger"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="fw-bold text-primary">
                  {r.time !== "-" ? r.time : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
