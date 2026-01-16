# UC00 — Overview (End-to-End)
```mermaid
sequenceDiagram
  autonumber
  participant T as Teacher
  participant A as TA
  participant FE as Frontend (Web/App)
  participant BE as Backend API
  participant QR as QR Service

  %% Login (Teacher/TA)
  T->>FE: Login
  FE->>BE: POST /api/v1/auth/login
  BE-->>FE: 200 (JWT)
  A->>FE: Login
  FE->>BE: POST /api/v1/auth/login
  BE-->>FE: 200 (JWT)

  %% Generate QR (Teacher)
  T->>FE: Generate QR (section + window)
  FE->>BE: POST /api/v1/attendance/sessions  (JWT)
  BE->>QR: Create QR (sessionId, token)
  QR-->>BE: qrUrl
  BE-->>FE: 201 (sessionId, qrUrl, expiresAt)

  %% View Attendance (Teacher/TA)
  T->>FE: View Attendance
  FE->>BE: GET /api/v1/sections/{sectionId}/attendance  (JWT)
  BE-->>FE: 200 rows

  %% TA tasks
  A->>FE: Open "My Tasks"
  FE->>BE: GET /api/v1/ta/tasks  (JWT role=TA)
  BE-->>FE: 200 tasks[]
