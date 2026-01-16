import React, { useState } from "react";
import { Search } from "lucide-react";

export default function Attendance() {
  const [students, setStudents] = useState([
    { studentId: "65001", name: "Alice", email: "alice@gg.com", status: "Active", note: "รอใบรับรองแพทย์" },
    { studentId: "65002", name: "Bob", email: "bob@gg.com", status: "Inactive", note: " " },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({
    studentId: "",
    name: "",
    email: "",
    status: "",
    note: "",
    index: null,
  });
  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    setCurrentStudent({ ...currentStudent, [e.target.name]: e.target.value });
  };

  const handleRowClick = (student, index) => {
    setCurrentStudent({ ...student, index });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    if (!currentStudent.studentId || !currentStudent.name) return;
    const newStudent = { ...currentStudent };
    delete newStudent.index;
    setStudents([...students, newStudent]);
    setShowModal(false);
  };

  const handleSave = () => {
    const updatedStudents = [...students];
    updatedStudents[currentStudent.index] = {
      studentId: currentStudent.studentId,
      name: currentStudent.name,
      email: currentStudent.email,
      status: currentStudent.status,
      note: currentStudent.note,
    };
    setStudents(updatedStudents);
    setShowModal(false);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4>Students</h4>
      </div>

      <div className="Box bg-white p-3 rounded shadow-sm mb-4">
        <div className="d-flex align-items-center mb-3 gap-2">
          <div className="input-group" style={{ maxWidth: "300px" }}>
            <span className="input-group-text bg-white">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search student..."
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleRowClick(s, idx)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.status}</td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? "Edit Student" : "Add Student"}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Student ID */}
                <div className="mb-3">
                  <label className="form-label">Student ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="studentId"
                    value={currentStudent.studentId}
                    onChange={handleChange}
                    disabled={isEdit} // ไม่ให้แก้ไข ID เวลา edit
                  />
                </div>

                {/* Student Name */}
                <div className="mb-3">
                  <label className="form-label">Student Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={currentStudent.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={currentStudent.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Status */}
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    name="status"
                    value={currentStudent.status}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Note */}
                <div className="mb-3">
                  <label className="form-label">Note</label>
                  <textarea
                    className="form-control"
                    name="note"
                    rows="2"
                    value={currentStudent.note}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-lightblue"
                  onClick={isEdit ? handleSave : handleAdd}
                >
                  {isEdit ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}