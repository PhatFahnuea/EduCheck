```mermaid
sequenceDiagram
  autonumber
  participant S as Student
  participant FE as Frontend (Web/App)
  participant BE as Backend API

  %% Login
  S->>FE: Login
  FE->>BE: POST /api/v1/auth/login
  BE-->>FE: 200 (JWT)

  %% Check-in via QR
  S->>FE: Scan QR (sessionId)
  FE->>BE: POST /api/v1/attendance/checkin {sessionId}  (JWT role=Student)

  %% Outcomes
  alt Success
    BE-->>FE: 200 Success
  else Missing/Invalid JWT
    BE-->>FE: 401 Unauthorized
  else Forbidden role
    BE-->>FE: 403 Forbidden
  else Session not found
    BE-->>FE: 404 Not Found
  else Duplicate
    BE-->>FE: 409 Conflict
  else Expired / Invalid token
    BE-->>FE: 410 Gone / 400 Bad Request
  end

  %% View My Attendance
  S->>FE: Open "My Attendance"
  FE->>BE: GET /api/v1/me/attendance  (JWT)
  BE-->>FE: 200 list
