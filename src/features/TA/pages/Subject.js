import React, { useState } from "react";
import { Search } from "lucide-react";

export default function Subject() {
  const [subjects, setSubjects] = useState([
    { id: "CP350001", name: "Web Design", ta: ["yui@gmail.com"], examDate: "2025-07-21" },
    { id: "CP350002", name: "PP of Softwere", ta: ["fang@gmail.com"], examDate: "" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({
    id: "",
    name: "",
    ta: [],
    taInput: "",
    examDate: "",
  });
  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    setCurrentSubject({ ...currentSubject, [e.target.name]: e.target.value });
  };


  const handleRowClick = (subject, index) => {
    setCurrentSubject({ ...subject, index, taInput: "" });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    if (!currentSubject.id || !currentSubject.name) return;
    const newSubject = { ...currentSubject };
    delete newSubject.index;
    delete newSubject.taInput;
    setSubjects([...subjects, newSubject]);
    setShowModal(false);
  };

  const handleSave = () => {
    const updatedSubjects = [...subjects];
    const updatedSubject = { ...updatedSubjects[currentSubject.index] };
    // แก้เฉพาะ TA, Password (id), Exam Date
    updatedSubject.ta = currentSubject.ta;
    updatedSubject.id = currentSubject.id;
    updatedSubject.examDate = currentSubject.examDate;
    updatedSubjects[currentSubject.index] = updatedSubject;
    setSubjects(updatedSubjects);
    setShowModal(false);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4>Subjects</h4>
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
              placeholder="Search your subject..."
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Subject ID</th>
                <th>Subject Name</th>
                <th>TA</th>
                <th>Exam Date</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleRowClick(s, idx)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.ta.join(", ")}</td>
                  <td>{s.examDate}</td>
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
                <h5 className="modal-name">{isEdit ? "Edit Subject" : "Add Subject"}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Add: กรอกทุก field */}
                {!isEdit && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Subject ID</label>
                      <input
                        type="text"
                        className="form-control"
                        name="id"
                        value={currentSubject.id}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={currentSubject.name}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}
                {isEdit && (
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="text"
                      className="form-control"
                      name="password"
                      value={currentSubject.password || ""}
                      onChange={handleChange}
                      placeholder="Enter new password"
                    />
                  </div>
                )}

                {/* TA Emails */}
                <div className="mb-3">
                  <label className="form-label">Teaching Assistant (TA)</label>
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter TA email"
                      name="taInput"
                      value={currentSubject.taInput || ""}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="btn btn-lightblue"
                    >
                      +
                    </button>
                  </div>
                  <div>
                    {currentSubject.ta.map((email, idx) => (
                      <span key={idx} className="badge bg-secondary me-1">
                        {email}
                        <button
                          type="button"
                          className="btn-close btn-close-white btn-sm ms-1"
                          aria-label="Remove"
                          onClick={() => {
                            const updatedTA = currentSubject.ta.filter((_, i) => i !== idx);
                            setCurrentSubject({ ...currentSubject, ta: updatedTA });
                          }}
                        ></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exam Date */}
                <div className="mb-3">
                  <label className="form-label">Exam Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="examDate"
                    value={currentSubject.examDate}
                    onChange={handleChange}
                  />
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