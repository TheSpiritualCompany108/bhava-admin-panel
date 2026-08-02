import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ text: "", ref: "" });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("bhava_token");
    if (!token) { navigate("/login"); return; }
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("bhava_token");
      const res = await fetch(`${API_BASE}/api/admin/quotes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setQuotes(json.data || []);
      } else if (res.status === 401 || res.status === 403) {
        navigate("/login");
      } else {
        setError(json.message || "Failed to load quotes");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({ text: "", ref: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("bhava_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const url = editingId
        ? `${API_BASE}/api/admin/quotes/${editingId}`
        : `${API_BASE}/api/admin/quotes`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const json = await res.json();
      if (res.ok && json.success) {
        resetForm();
        fetchQuotes();
      } else {
        setError(json.message || `Error ${res.status}`);
      }
    } catch (err) {
      setError(err.message || "Network error");
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setForm({ text: q.text || "", ref: q.ref || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this quote?")) return;
    const token = localStorage.getItem("bhava_token");
    const res = await fetch(`${API_BASE}/api/admin/quotes/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (json.success) fetchQuotes(); else alert(json.message || "Error");
  };

  const logout = () => { localStorage.removeItem("bhava_token"); navigate("/login"); };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4f0" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "12px 20px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <h2 style={{ margin: 0, color: "#4A0B1D" }}>Admin Dashboard - Quotes</h2>
          <Link to="/" style={{ color: "#E07B39", fontWeight: 600, textDecoration: "none" }}>Tiles</Link>
          <span style={{ color: "#4A0B1D", fontWeight: 700 }}>Quotes</span>
        </div>
        <button onClick={logout} style={{ padding: "8px 16px", background: "#E07B39", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Logout</button>
      </div>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px 40px" }}>
        {loading && <div style={{ padding: 12, background: "#fffbe6", borderRadius: 6, marginBottom: 12 }}>Loading quotes…</div>}
        {error && <div style={{ padding: 12, background: "#ffe6e6", color: "#900", borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        <div style={{ background: "#fff", padding: 20, borderRadius: 8, marginBottom: 24, border: "2px solid #E07B39" }}>
          <h3 style={{ marginTop: 0, color: "#4A0B1D", fontSize: 16 }}>
            {editingId ? "✏️ Edit Quote" : "➕ Add New Quote"}
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#666" }}>
            Every quote you add here rotates on the "Today's Reflection" section of the homepage, changing every 5 seconds.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Quote Text *</label>
              <textarea
                name="text"
                value={form.text}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13, minHeight: 90, resize: "vertical" }}
                placeholder="This is the real meaning of yoga — a deliverance from contact with pain and sorrow..."
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Translation / Reference *</label>
              <input
                name="ref"
                value={form.ref}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }}
                placeholder="e.g., Bhagavad Gita 6:23"
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={{ flex: 1, padding: 12, background: "#4CAF50", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                {editingId ? "✓ Save Changes" : "✓ Add Quote"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ flex: 1, padding: 12, background: "#f0f0f0", color: "#333", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <h3 style={{ marginTop: 0, color: "#4A0B1D" }}>All Quotes ({quotes.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quotes.length === 0 && !loading && (
            <p style={{ color: "#999", fontSize: 13 }}>No quotes yet. The homepage is showing today's built-in quote until you add one here.</p>
          )}
          {quotes.map((q) => (
            <div key={q._id} style={{
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              border: editingId === q._id ? "2px solid #E07B39" : "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 6px 0", fontSize: 14, fontStyle: "italic", color: "#333" }}>&ldquo;{q.text}&rdquo;</p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#9B3A2A" }}>{q.ref}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleEdit(q)} style={{ padding: "6px 12px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Edit</button>
                <button onClick={() => handleDelete(q._id)} style={{ padding: "6px 12px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
