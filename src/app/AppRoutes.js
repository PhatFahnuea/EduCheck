import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { routesByRole } from "./rbac";

// pages เดิม
import Home from "../features/teacher/pages/Home";
import TeacherAttendance from "../features/teacher/pages/TeacherAttendance";
import CheckinPage from "../features/attendance/CheckinPage";
import AddCourse from "../features/teacher/pages/AddCourse";
import CourseDetail from "../features/teacher/pages/CourseDetail";
import Assignments from "../features/teacher/pages/Assignments";
import StudentCourseAssignments from "../features/student/pages/CourseAssignments";
import ExamCreate from "../features/teacher/pages/ExamCreate";


// ⬇️ เพิ่มหน้าใหม่ (รวมงานที่ส่ง + ให้คะแนน)
import TeacherSubmissions from "../features/teacher/pages/TeacherSubmissions";

export default function AppRoutes({ role, components = {} }) {
  const menu = routesByRole[role] || [];

  const registry = {
    Home,
    TeacherAttendance,
    _PublicCheckin: CheckinPage,
    AddCourse,
    CourseDetail,
    Assignments,
    StudentCourseAssignments,

    // ⬇️ ลงทะเบียนให้ RBAC เรียกใช้ element: "TeacherSubmissions"
    TeacherSubmissions,ExamCreate,

    ...components,
  };

  return (
    <Routes>
      {menu.map(({ path, element }) => {
        const Comp = registry[element] || components[element];
        return (
          <Route
            key={path}
            path={path}
            element={Comp ? <Comp /> : <div>⚠️ Component not found: {element}</div>}
          />
        );
      })}

      {/* เส้นทางทั่วไปที่ยังใช้อยู่ */}
      <Route path="/teacher/home" element={<Home />} />
      <Route path="/teacher/attendance" element={<TeacherAttendance />} />
      <Route path="/attendance/checkin" element={<CheckinPage />} />
      <Route path="/teacher/subject/add" element={<AddCourse />} />
      <Route path="/teacher/subject/:courseId" element={<CourseDetail />} />
      <Route path="/teacher/subject/:courseId/assignments" element={<Assignments />} />
      <Route path="/teacher/section/:sectionId/exams/new" element={<ExamCreate />} />

      {/* ถ้าเข้าผิด path ให้เด้งไปเมนูแรกของ role */}
      <Route
        path="*"
        element={
          menu.length > 0
            ? <Navigate to={menu[0].path} replace />
            : <Navigate to="/teacher/home" replace />
        }
      />
    </Routes>
  );
}
