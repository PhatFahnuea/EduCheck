// src/components/Topbar.jsx
import React, { useMemo } from "react";

export default function Topbar({
  user = { name: "อาจารย์", email: "teacher@example.com", avatar: "" },
  role = "teacher",
  title,
  onToggleSidebar,
}) {
  const displayTitle = title || user?.name || "Instructor Portal";

  // ตัวย่อชื่อสำหรับ placeholder avatar
  const initials = useMemo(() => {
    const n = (user?.name || "T P").trim();
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] || "T";
    const last = parts[1]?.[0] || (parts[0]?.[1] || "P");
    return (first + last).toUpperCase();
  }, [user?.name]);

  const handleLogout = () => {
    // ✅ กล่องยืนยันก่อนออกจากระบบ
    const ok = window.confirm("ยืนยันออกจากระบบ?");
    if (!ok) return;

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav className="topbar navbar sticky-top px-3">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        {/* Left: menu (mobile) + brand */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary d-lg-none"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list" />
          </button>

          <a className="brand d-flex align-items-center text-decoration-none" href="/">
            <div className="brand-logo me-2">
              <i className="bi bi-mortarboard" />
            </div>
            <div className="brand-text">
              <div className="brand-title text-truncate">
                Instructor's Teaching and Learning Management System
              </div>
              <div className="brand-sub">Learning Management</div>
            </div>
          </a>
        </div>

        {/* Right: role, user, logout */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          <span className="badge role-pill text-uppercase">
            {String(role || "").trim() || "guest"}
          </span>

          {/* Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="avatar rounded-circle"
              width="36"
              height="36"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextSibling;
                if (fallback) fallback.style.display = "grid";
              }}
            />
          ) : null}

          {/* Fallback Avatar (initials) */}
          <div className="avatar-fallback rounded-circle" aria-hidden={!!user?.avatar}>
            {initials}
          </div>

          {/* Name + Email */}
          <div className="small text-end d-none d-sm-block">
            <div className="fw-semibold text-dark-emphasis text-truncate" style={{ maxWidth: 180 }}>
              {user?.name || displayTitle || "Teacher"}
            </div>
            <div className="text-muted text-truncate" style={{ maxWidth: 180 }}>
              {user?.email || "teacher@example.com"}
            </div>
          </div>

          <button className="btn btn-danger-soft btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1" />
            Logout
          </button>
        </div>
      </div>

      <style>{`
        .topbar {
          background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
          border-bottom: 1px solid rgba(2, 6, 23, 0.06);
          box-shadow: 0 2px 10px rgba(2,6,23,.04);
        }
        .brand .brand-logo {
          width: 36px; height: 36px;
          border-radius: 12px;
          display: grid; place-items: center;
          background: #eef2ff;
          color: #4f46e5;
          box-shadow: inset 0 0 0 1px rgba(79,70,229,.15);
          font-size: 18px;
        }
        .brand .brand-title {
          font-weight: 700;
          letter-spacing: .2px;
          color: #0f172a;
          max-width: 240px;
        }
        .brand .brand-sub {
          font-size: .75rem;
          color: #64748b;
          letter-spacing: .3px;
        }
        .role-pill {
          background: #f1f5ff !important;
          color: #1f3b93 !important;
          border: 1px solid #dbe4ff;
          padding: .35rem .5rem;
          font-weight: 600;
          letter-spacing: .6px;
        }
        .avatar, .avatar-fallback {
          width: 36px; height: 36px;
          box-shadow: 0 1px 3px rgba(2,6,23,.1);
          border: 1px solid rgba(2,6,23,.06);
        }
        .avatar-fallback {
          display: ${/* ซ่อนเมื่อมีรูปจริง */""} ${user?.avatar ? "none" : "grid"};
          place-items: center;
          background: linear-gradient(135deg, #e0e7ff, #f0f9ff);
          color: #1e293b;
          font-weight: 700;
          font-size: .85rem;
          user-select: none;
        }
        .btn-danger-soft {
          background: #fff1f2;
          color: #b91c1c;
          border: 1px solid #ffe4e6;
        }
        .btn-danger-soft:hover {
          background: #ffe4e6;
          color: #991b1b;
          border-color: #fecdd3;
        }
        @media (max-width: 576px){
          .brand .brand-sub { display:none; }
        }
      `}</style>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
      />
    </nav>
  );
}
