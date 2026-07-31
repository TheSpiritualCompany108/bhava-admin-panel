import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success && json.token) {
        localStorage.setItem("bhava_token", json.token);
        navigate("/");
      } else {
        alert(json.message || "Login failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: 520, background: "#fff", padding: 36, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", fontFamily: "Canela, serif" }}>Admin Login</h2>
        <p style={{ textAlign: "center", color: "#666" }}>Sign in to access the dynamic content database.</p>
        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: "#333", fontWeight: 600 }}>Email Address</label>
            <input required value={email} onChange={(e)=>setEmail(e.target.value)} type="email" style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #e6e6e6" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 8, color: "#333", fontWeight: 600 }}>Administrator Password</label>
            <input required value={password} onChange={(e)=>setPassword(e.target.value)} type="password" style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #e6e6e6" }} />
          </div>
          <button type="submit" style={{ width: "100%", padding: 14, background: "#ea7f3b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700 }}>{loading ? "Authenticating..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
