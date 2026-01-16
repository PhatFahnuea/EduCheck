import React, { useEffect, useState } from "react";
import "./Exam.css";
import { getUpcomingExams } from '../../../services/studentApi';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getUpcomingExams();
      setExams(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="content-wrap">
        <h4 className="mb-3">Exam Schedule</h4>
        <p className="text-muted">Loading exams…</p>
      </div>
    );
  }

  return (
    <div className="content-wrap">
      <h4 className="mb-3">Exam Schedule</h4>
      <p className="text-muted small mb-3">Upcoming exams overview</p>

      {exams.length === 0 ? (
        <div className="text-muted">No upcoming exams scheduled.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Course</th>
                <th>Exam Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Countdown</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => (
                <tr key={i}>
                  <td>{exam.course}</td>
                  <td>{exam.type}</td>
                  <td>{exam.date}</td>
                  <td>{exam.time}</td>
                  <td>{exam.duration}</td>
                  <td>
                    <span
                      className={`badge ${
                        exam.status === "COMPLETED"
                          ? "bg-success"
                          : exam.status === "SCHEDULED"
                          ? "bg-primary"
                          : exam.status === "CANCELLED"
                          ? "bg-danger"
                          : "bg-secondary"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </td>
                  <td className="text-muted">{exam.countdown}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
