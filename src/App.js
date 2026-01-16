import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import Topbar from './layout/Topbar';
import Sidebar from './layout/Sidebar';
import Login from './features/auth/login';
import AppRoutes from './app/AppRoutes';
import { ROLES, routesByRole } from './app/rbac';

// --- import ทุกหน้าไว้ก่อน (mock data phase) ---
import StudentHome from './features/student/pages/Home';
import StudentAttendance from './features/student/pages/AttendanceHistory';
import StudentExams from './features/student/pages/Exam';
import StudentPoint from './features/student/pages/Point';
import StudentGrade from './features/student/pages/Grade';

import TeacherHome from './features/teacher/pages/Home';
import TeacherSubject from './features/teacher/pages/Subject';
import TeacherAttendance from './features/teacher/pages/Attendance';
import TeacherAssignments from './features/teacher/pages/Assignments';
import AddCourse from './features/teacher/pages/AddCourse';
import CourseDetail from "./features/teacher/pages/CourseDetail";


import TAHome from './features/TA/pages/Home';
import TAAttendance from './features/TA/pages/Attendance';
import TAAssignments from './features/TA/pages/Assignments';
import TASubject from './features/TA/pages/Subject';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();


  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const rawRole = localStorage.getItem('role'); 
  const roleKey = (rawRole || '').toLowerCase();


  const valid = [ROLES.STUDENT, ROLES.TEACHER, ROLES.ASSISTANT];
  const isAuthed = Boolean(token) && valid.includes(roleKey);
  const role = isAuthed ? roleKey : null;


  const isAuthPage = location.pathname.startsWith('/login');
  useEffect(() => {
    if (!isAuthed && !isAuthPage) {
      navigate('/login', { replace: true });
    }
  }, [isAuthed, isAuthPage, navigate]);



  const menu = role ? (routesByRole[role] || []) : [];

  const components = {
    // student
    StudentHome, StudentAttendance, StudentExams, StudentPoint, StudentGrade,
    // teacher
    TeacherHome, TeacherSubject, TeacherAttendance, TeacherAssignments,
    // TA
    TAHome, TAAttendance, TAAssignments, TASubject,
  };

  // === base path ของแต่ละ role ===
  const baseByRole = (r) => (
    r === 'teacher' ? '/teacher' :
    r === 'assistant' ? '/ta' :
    '/student'
  );
  const base = role ? baseByRole(role) : '';

  return (
    <>
      {role && !isAuthPage && (
        <Topbar
          role={role}
          user={{
            name: 'User',
            email: 'user@kku.ac.th',
            avatar: '/cutie.jpg',
          }}
        />
      )}

      <div className="container-fluid">
        <div className="row flex-nowrap">
          {role && !isAuthPage && (
            <aside className="col-auto p-0">
              <Sidebar menu={menu} base={base} />
            </aside>
          )}

        
          <main className={role && !isAuthPage ? 'col' : 'col-12'}>
            <div className="content-wrap p-3">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                {role && (
                  <Route path="/*" element={<AppRoutes role={role} components={components} />} />
                )}
                {!role && (
                  <Route path="*" element={<Navigate to="/login" replace />} />
                )}
                {role && (
                  <Route path="*" element={<Navigate to={menu[0]?.path || '/login'} replace />} />
                )}
              </Routes>
            </div>
          </main>

        </div>
      </div>
    </>
  );
}
