export const ROLES = {
  TEACHER:   "teacher",
  ASSISTANT: "assistant",
  STUDENT:   "student"
};

export const routesByRole = {
  [ROLES.STUDENT]: [
    { path: "/student/home",        label: "Home",               element: "StudentHome",        icon: "bi-house" },
    { path: "/student/attendance",  label: "Attendance History", element: "StudentAttendance",  icon: "bi-calendar-check" },
    { path: "/student/exams",       label: "Exam Schedule",      element: "StudentExams",       icon: "bi-journal-text" },
    { path: "/student/point",       label: "Point",              element: "StudentPoint",       icon: "bi-graph-up" },
    { path: "/student/grade",       label: "Grade",              element: "StudentGrade",       icon: "bi-mortarboard" },
  ],

  [ROLES.TEACHER]: [
    { path: "/teacher/home",         label: "Home",         element: "TeacherHome",         icon: "bi-house" },
    { path: "/teacher/subject",      label: "Subjects",     element: "TeacherSubject",      icon: "bi-journal-bookmark" },
    { path: "/teacher/attendance",   label: "Attendance",   element: "TeacherAttendance",   icon: "bi-people" },

    // ⬇️ เปลี่ยนจาก /teacher/assignments เป็น /teacher/submissions
    { path: "/teacher/submissions",  label: "Submissions",  element: "TeacherSubmissions",  icon: "bi-inbox-arrow-down" },
  ],

  [ROLES.ASSISTANT]: [
    { path: "/ta/home",        label: "Home",        element: "TAHome",         icon: "bi-house" },
    { path: "/ta/attendance",  label: "Attendance",  element: "TAAttendance",   icon: "bi-people" },
    { path: "/ta/assignments", label: "Assignments", element: "TAAssignments",  icon: "bi-clipboard-check" },
    { path: "/ta/subject",     label: "Subjects",    element: "TASubject",      icon: "bi-journal-bookmark" },
  ],
};

export function getDefaultPath(role) {
  const menu = routesByRole[role] || [];
  return menu.length ? menu[0].path : "/login";
}

export function getMenuByRole(role) {
  return routesByRole[role] || [];
}
