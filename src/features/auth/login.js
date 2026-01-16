import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesByRole } from "../../app/rbac";
import { apiJson, setToken, clearToken } from "../../lib/api";

// map role ฝั่ง backend -> key ที่ frontend ใช้
function normalizeRole(r) {
  const x = String(r || "").toUpperCase();
  if (x === "PROFESSOR" || x === "TEACHER") return "teacher";
  if (x === "TA" || x === "ASSISTANT")      return "assistant";
  if (x === "ADMIN")                         return "admin";
  return "student"; // เผื่อกรณีอื่น ๆ
}

// ถอด payload จาก JWT (ถ้าหลังบ้านฝัง role ใน token)
function parseJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch { return {}; }
}

export default function Login() {
  const [id, setId] = useState("");        // username หรือ email
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    if (!id || !password) return;

    try {
      setLoading(true);
      clearToken();

      // ✅ ส่งแค่ username/email + password
      const body = { username: id, password };

      const data = await apiJson(`/api/v1/auth/login`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const token     = data?.data?.accessToken || data?.accessToken;
      const tokenType = data?.data?.tokenType   || data?.tokenType || "Bearer";
      if (!token) throw new Error("Login success but token is missing");

      // เก็บ token ให้การ์ดเห็นทุกคีย์
      setToken(token, tokenType);
      localStorage.setItem("token", token);
      localStorage.setItem("access_token", token);
      localStorage.setItem("token_type", tokenType);

      // 1) พยายามอ่าน role จาก response
      let backRoleRaw = data?.data?.role || data?.role;

      // 2) ถ้า response ไม่มี role ให้ลองอ่านจาก JWT payload
      if (!backRoleRaw) {
        const payload = parseJwt(token);
        backRoleRaw = payload?.role || (payload?.roles?.[0]) || payload?.authorities?.[0];
      }

      // 3) กรณีสุดท้าย ถ้า backend ไม่มีทั้งสองแบบ ให้ยิง /auth/me ดู
      if (!backRoleRaw) {
        try {
          const me = await apiJson(`/api/v1/auth/me`, { method: "GET" });
          backRoleRaw = me?.role || (me?.roles?.[0]) || (me?.authorities?.[0]);
        } catch { /* ignore */ }
      }

      if (!backRoleRaw) {
        throw new Error("Cannot determine user role from backend");
      }

      const roleKey = normalizeRole(backRoleRaw); // => teacher | assistant | student | admin

      // เซฟ user + role
      localStorage.setItem("role", roleKey);
      localStorage.setItem("user", JSON.stringify({
        name: String(id).split("@")[0],
        email: id.includes("@") ? id : undefined,
        role: roleKey,
      }));

      // นำทางตาม role จริง
      const firstFromRBAC = routesByRole[roleKey]?.[0]?.path;
      const fallbackByRole =
        roleKey === "teacher"   ? "/teacher/home" :
        roleKey === "assistant" ? "/ta/home"      :
        roleKey === "admin"     ? "/admin/home"   :
                                  "/student/home";

      navigate(firstFromRBAC || fallbackByRole, { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: 400 }}>
        <h4 className="text-center mb-4">Login</h4>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label fw-bold">Email / Username</label>
            <input
              type="text"
              id="id"
              className="form-control"
              placeholder="email หรือ username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-bold">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {err && <div className="alert alert-danger py-2">{err}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            กรอกเพียง  และรหัสผ่านเพื่อเข้าสู่ระบบ
          </small>
        </div>
      </div>
    </div>
  );
}
