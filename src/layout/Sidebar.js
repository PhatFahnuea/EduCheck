// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar({
  className = "",
  onItemClick,
  // ถ้าไม่ส่ง menu มา จะ generate อัตโนมัติจาก courseId/sectionId
  menu,
  courseId,
  sectionId,
  showAssignments = true,   // เผื่อบางหน้าจะซ่อน
  showAttendance = true,    // เผื่อบางหน้าจะซ่อน
}) {
  const { pathname } = useLocation();

  const autoMenu = React.useMemo(() => {
    const items = [
      { path: "/", label: "Home", icon: "bi-house" },
      { path: "/teacher/subjects", label: "Subjects", icon: "bi-journals" },
    ];

    if (courseId) {
      items.push({
        path: `/teacher/subject/${courseId}`,
        label: "Course Detail",
        icon: "bi-journal-text",
        end: false,
      });
      if (showAssignments) {
        const to = sectionId
          ? `/teacher/subject/${courseId}/assignments?section=${sectionId}`
          : `/teacher/subject/${courseId}/assignments`;
        items.push({
          path: to,
          label: "Assignments",
          icon: "bi-clipboard-check",
          end: false,
          isActive: () => pathname.includes(`/teacher/subject/${courseId}/assignments`),
        });
      }
    }

    if (showAttendance) {
      items.push({
        path: "/attendance/checkin",
        label: "Attendance",
        icon: "bi-check2-square",
      });
    }
    return items;
  }, [courseId, sectionId, pathname, showAssignments, showAttendance]);

  const items = menu?.length ? menu : autoMenu;

  return (
    <aside className={`sidebar p-3 ${className}`}>
      <ul className="nav nav-pills flex-column gap-1">
        {items.map(({ path, label, icon, end = true, isActive }, idx) => (
          <li key={`${path}-${idx}`} className="nav-item">
            <NavLink
              to={path}
              end={end}
              className={({ isActive: defaultActive }) =>
                `nav-link${(isActive ? isActive() : defaultActive) ? " active" : ""}`
              }
              onClick={onItemClick}
            >
              {icon && <i className={`bi ${icon} me-2`} />}
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>

    
  );
}
    
  