import React, { useEffect, useState } from "react";
import "./Grade.css";
import { getPoints, getGradeConfig } from '../../../services/studentApi';

export default function Grades() {
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState({
    midterm: 30,
    assignment: 30,
    attendance: 10,
    final: 30,
  });

  const [scores, setScores] = useState({
    midterm: 0,
    assignment: 0,
    attendance: 0,
    final: 0,
  });

  const [target, setTarget] = useState("A");
  const [thresholds, setThresholds] = useState([]);

  useEffect(() => {
    (async () => {
      const [points, gradeConfig] = await Promise.all([
        getPoints(),
        getGradeConfig(),
      ]);

      setWeights(gradeConfig.weights);
      setThresholds(gradeConfig.thresholds);

      setScores({
        midterm: points.lab.got,
        assignment: points.assign.got,
        attendance: points.attend.got,
        final: 0, // ให้ผู้ใช้ลองกรอกเอง
      });

      setLoading(false);
    })();
  }, []);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));
  const totalMax =
    weights.midterm + weights.assignment + weights.attendance + weights.final;

  const rawMid = scores.midterm;
  const rawAsg = scores.assignment;
  const rawAtt = scores.attendance;
  const rawFin = scores.final;

  const currentWithoutFinal =
    ((rawMid + rawAsg + rawAtt) / totalMax) * 100;
  const projectedOverall =
    ((rawMid + rawAsg + rawAtt + rawFin) / totalMax) * 100;

  const targetMin =
    thresholds.find((g) => g.key === target)?.min ?? 80;

  const needRawFinal =
    (targetMin / 100) * totalMax - (rawMid + rawAsg + rawAtt);

  let neededText = "";
  if (weights.final === 0) {
    neededText = "Final ไม่มีสัดส่วนในเกรด";
  } else if (needRawFinal <= 0) {
    neededText = "ถึงเกรดเป้าแล้ว 🎉";
  } else if (needRawFinal > weights.final) {
    neededText = "ต้องการมากกว่าคะแนนเต็ม Final → เกรดนี้ทำไม่ได้";
  } else {
    neededText = `ต้องได้อย่างน้อย ${needRawFinal.toFixed(1)} / ${weights.final} คะแนน`;
  }

  if (loading)
    return <div className="content-wrap">Loading grade calculator…</div>;

  return (
    <div className="content-wrap">
      <h4 className="mb-1">Grade Calculator</h4>
      <p className="text-muted mb-4">
        คำนวณเกรดรวม + หา Final ขั้นต่ำเพื่อให้ได้เกรดเป้าหมาย
      </p>

      {/* Scores Input */}
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="mb-3">คะแนนแต่ละส่วน (คะแนนดิบ)</h6>
          <div className="row g-3">
            {[
              { key: "midterm", label: "Midterm", max: weights.midterm },
              { key: "assignment", label: "Assignment", max: weights.assignment },
              { key: "attendance", label: "Attendance", max: weights.attendance },
              { key: "final", label: "Final", max: weights.final },
            ].map(({ key, label, max }) => (
              <div key={key} className="col-6 col-md-3">
                <label className="form-label small">
                  {label} (เต็ม {max})
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={scores[key]}
                  min={0}
                  max={max}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [key]: clamp(e.target.value, 0, max),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6>Progress ตอนนี้</h6>
              <div className="display-6">
                {currentWithoutFinal.toFixed(1)} / 100
              </div>
              <small className="text-muted">
                รวมพร้อม Final (จำลอง): {projectedOverall.toFixed(1)} / 100
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6>คะแนน Final ขั้นต่ำที่ต้องได้</h6>
              <div className="d-flex align-items-end gap-2 mb-2">
                <select
                  className="form-select"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {thresholds.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.key} (≥{g.min})
                    </option>
                  ))}
                </select>
              </div>
              <div className="h6">{neededText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
