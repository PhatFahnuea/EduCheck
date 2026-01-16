// src/app/config.js
// รองรับทั้ง Vite และ CRA โดยไม่แตะ typeof import

const viteBase =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) || undefined;

const craBase = process.env.REACT_APP_API_BASE || undefined;

const windowBase =
  (typeof window !== "undefined" && window.API_BASE) || undefined;

// ลำดับความสำคัญ: Vite > CRA > window > fallback
export const API_BASE = viteBase || craBase || windowBase || "http://localhost:8080";
