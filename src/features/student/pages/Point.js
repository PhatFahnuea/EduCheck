import React, { useEffect, useState } from "react";
import "./Point.css";
import { getPoints } from '../../../services/studentApi';

export default function Point() {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPoints().then((data) => {
      setPoints(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="content-wrap">
        <h4>Point Dashboard</h4>
        <p className="text-muted">Loading points…</p>
      </div>
    );
  }

  const rows = [
    { label: "Total Points", got: points.total.got, max: points.total.max },
    { label: "Assignment Points", got: points.assign.got, max: points.assign.max },
    { label: "Lab Points", got: points.lab.got, max: points.lab.max },
    { label: "Attendance Points", got: points.attend.got, max: points.attend.max },
  ];

  const pct = (got, max) => (max ? Math.min(100, (got / max) * 100) : 0);

  return (
    <div className="content-wrap">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h4 className="mb-0">Point Dashboard</h4>
        <span className="text-muted small">Overview of points accumulated</span>
      </div>

      {/* Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="point-card">
            <div className="small text-muted">Total Points</div>
            <div className="display-6">{points.total.got}</div>
            <div className="small text-muted">/ {points.total.max}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="point-card">
            <div className="small text-muted">Assignment Points</div>
            <div className="display-6">{points.assign.got}</div>
            <div className="small text-muted">/ {points.assign.max}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="point-card">
            <div className="small text-muted">Lab Points</div>
            <div className="display-6">{points.lab.got}</div>
            <div className="small text-muted">/ {points.lab.max}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="point-card">
            <div className="small text-muted">Attendance Points</div>
            <div className="display-6">{points.attend.got}</div>
            <div className="small text-muted">/ {points.attend.max}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-body">
          <h6 className="mb-3">Points Distribution</h6>

          <div className="bars">
            {rows.map((r) => (
              <div key={r.label} className="bar-row">
                <div className="bar-label">{r.label}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct(r.got, r.max)}%` }}
                  ></div>
                </div>
                <div className="bar-value">
                  {r.got} / {r.max}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
