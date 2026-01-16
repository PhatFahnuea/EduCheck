// src/features/student/pages/Home.js
import React, { useEffect, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../../services/studentApi";

export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    checkedInToday: 0,
    totalAbsences: 0,
    upcomingExams: 0,
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboard("me");
        const s = data.stats ?? {
          coursesEnrolled: data.coursesEnrolled ?? (data.courses?.length || 0),
          checkedInToday: data.checkedInToday ?? 0,
          totalAbsences: data.totalAbsences ?? 0,
          upcomingExams: data.upcomingExams ?? 0,
        };
        setStats(s);
        setCourses(data.courses ?? []);
      } catch (e) {
        console.error("Dashboard fetch failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="student-home">
      {/* Header */}
      <div className="header-bar">
        <div>
          <h2 className="title">Student Dashboard</h2>
          <p className="subtitle">ภาพรวมการเรียนของคุณวันนี้</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Courses Enrolled" value={stats.coursesEnrolled} icon="bi-journal-bookmark" tone="primary" loading={loading} />
        <StatCard label="Checked-in Today" value={stats.checkedInToday} icon="bi-qr-code-scan" tone="emerald" loading={loading} />
        <StatCard label="Total Absences" value={stats.totalAbsences} icon="bi-exclamation-octagon" tone="amber" loading={loading} />
        <StatCard label="Upcoming Exams" value={stats.upcomingExams} icon="bi-calendar-event" tone="purple" loading={loading} />
      </div>

      {/* Courses */}
      <div className="section-head">
        <h5 className="section-title">
          <i className="bi bi-mortarboard me-2" /> Courses you’re enrolled in
        </h5>
      </div>

      {loading ? (
        <div className="courses-grid">
          {Array.from({ length: 4 }).map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">🎒</div>
          <h6>ยังไม่มีรายวิชาที่ลงทะเบียน</h6>
          <p className="text-muted">รออาจารย์เพิ่มคุณเข้ารายวิชา หรือกลับมาเช็คใหม่อีกครั้ง</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((c, idx) => {
            const courseId = c.id ?? c.courseId ?? c.code ?? idx;   // พยายามเดา id/รหัส
            const sectionId = c.sectionId ?? c.section?.id ?? c.section; // เผื่อว่ามี section
            const go = () => {
              // ถ้ามี sectionId จะพาไปแบบ ?section=...
              if (sectionId) {
                navigate(`/student/course/${courseId}?section=${sectionId}`);
              } else {
                navigate(`/student/course/${courseId}`);
              }
            };
            return (
              <CourseCard
                key={courseId}
                title={c.name || c.title || "Untitled course"}
                code={c.code || "COURSE"}
                teacher={c.teacher || c.owner || "–"}
                schedule={c.days || c.schedule || "–"}
                time={c.time || c.timeslot || "–"}
                room={c.room || c.location || "–"}
                color={c.color}
                onClick={go}
              />
            );
          })}
        </div>
      )}

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
    </div>
  );
}

/* -------- Components -------- */

function StatCard({ label, value, icon, tone = "primary", loading }) {
  return (
    <div className={`stat-card pro tone-${tone}`}>
      <div className="stat-top">
        <div className="icon-wrap"><i className={`bi ${icon}`} /></div>
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        {loading ? <div className="skeleton-line lg" /> : <div className="stat-value">{value}</div>}
      </div>
    </div>
  );
}

function CourseCard({ title, code, teacher, schedule, time, room, color, onClick }) {
  return (
    <button className="course-card course-clickable" onClick={onClick}>
      <div className={`course-banner ${color || ""}`} />
      <div className="course-body">
        <div className="course-title">
          <span className="badge code">{code}</span>
          <h6 className="name">{title}</h6>
        </div>
        <div className="meta">
          <div><i className="bi bi-person-fill me-2" /> {teacher}</div>
          <div><i className="bi bi-calendar2-week me-2" /> {schedule}</div>
          <div><i className="bi bi-clock me-2" /> {time}</div>
          <div><i className="bi bi-geo-alt me-2" /> {room}</div>
        </div>
      </div>
    </button>
  );
}

function CourseSkeleton() {
  return (
    <div className="course-card">
      <div className="course-banner skeleton" />
      <div className="course-body">
        <div className="badge code skeleton-line sm" />
        <div className="skeleton-line md" style={{ width: "80%" }} />
        <div className="meta">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-line sm" />)}</div>
      </div>
    </div>
  );
}
