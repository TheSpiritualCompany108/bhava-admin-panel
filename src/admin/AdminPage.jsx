import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPage() {
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const categories = [
    "Sacred Wisdom",
    "Daily Sacred",
    "Paths of Dharmic",
    "Living Wisdom",
    "Products"
  ];
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [form, setForm] = useState({ 
    title: "", 
    subtitle: "", 
    badgeText: "", 
    duration: "", 
    summary: "", 
    fullDescription: "",
    lessons: [],
    category: categories[0] 
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [newLesson, setNewLesson] = useState({ title: "", duration: "" });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState({
    num: 1,
    title: "",
    duration: ""
  });
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);
  const [sessionImage, setSessionImage] = useState(null);
  const [sessionImagePreview, setSessionImagePreview] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("bhava_token");
    if (!token) { navigate("/login"); return; }
    // fetch tiles for active category
    fetchTiles();
  }, [activeCategory]);

  const fetchTiles = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("bhava_token");
      const url = `${API_BASE}/api/admin/tiles${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ""}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (res.ok && json.success) {
        setTiles(json.data || []);
      } else if (res.status === 401 || res.status === 403) {
        navigate("/login");
      } else {
        console.error("Failed to load tiles", res.status, json);
        setError(json.message || "Failed to load tiles");
      }
    } catch (err) {
      console.error("Error fetching tiles:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSessionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSessionImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSessionImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data - handle FormData with image upload
    let body;
    let headers = {};
    const token = localStorage.getItem("bhava_token");
    
    if (image) {
      // Use FormData for image upload
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'lessons') {
          fd.append(k, JSON.stringify(form[k]));
        } else {
          fd.append(k, form[k]);
        }
      });
      fd.append("image", image);
      body = fd;
    } else {
      // Use JSON for no image
      body = JSON.stringify(form);
      headers['Content-Type'] = 'application/json';
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const url = editingId ? `${API_BASE}/api/admin/tiles/${editingId}` : `${API_BASE}/api/admin/tiles`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, body, headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setForm({ 
          title: "", 
          subtitle: "", 
          badgeText: "", 
          duration: "", 
          summary: "",
          fullDescription: "",
          lessons: [],
          category: activeCategory 
        });
        setImage(null);
        setImagePreview(null);
        setEditingId(null);
        setSelectedTile(null);
        setNewLesson({ title: "", duration: "" });
        fetchTiles();
      } else {
        const msg = json.message || `Error ${res.status}`;
        console.error("Submit error:", msg, json);
        setError(msg);
      }
    } catch (err) {
      console.error("Submit exception:", err);
      setError(err.message || "Network error");
    }
  };

  const handleEdit = (tile) => {
    setSelectedTile(tile);
    setEditingId(tile._id);
    setForm({ 
      title: tile.title || "", 
      subtitle: tile.subtitle || "", 
      badgeText: tile.badgeText || "", 
      duration: tile.duration || "", 
      summary: tile.summary || "", 
      fullDescription: tile.fullDescription || "",
      lessons: Array.isArray(tile.lessons) ? [...tile.lessons] : [],
      category: tile.category || activeCategory 
    });
    setNewLesson({ title: "", duration: "" });
    setImage(null);
    setImagePreview(null);
  };

  const addLesson = () => {
    if (!newLesson.title || !newLesson.duration) {
      alert("Please fill in lesson title and duration");
      return;
    }
    const num = (form.lessons?.length || 0) + 1;
    setForm({
      ...form,
      lessons: [...(form.lessons || []), { num, title: newLesson.title, duration: newLesson.duration }]
    });
    setNewLesson({ title: "", duration: "" });
  };

  const openSessionModal = (index = null) => {
    if (index !== null) {
      // Edit existing session
      const session = form.lessons[index];
      setCurrentSessionData({
        num: session.num,
        title: session.title,
        duration: session.duration
      });
      setEditingSessionIndex(index);
      setSessionImage(null);
      setSessionImagePreview(null);
    } else {
      // Add new session
      const num = (form.lessons?.length || 0) + 1;
      setCurrentSessionData({
        num,
        title: "",
        duration: ""
      });
      setEditingSessionIndex(null);
      setSessionImage(null);
      setSessionImagePreview(null);
    }
    setShowSessionModal(true);
  };

  const saveSession = () => {
    if (!currentSessionData.title || !currentSessionData.duration) {
      alert("Please fill in session title and duration");
      return;
    }

    let updatedLessons;
    if (editingSessionIndex !== null) {
      // Update existing session
      updatedLessons = [...form.lessons];
      updatedLessons[editingSessionIndex] = { ...currentSessionData, num: editingSessionIndex + 1 };
    } else {
      // Add new session
      updatedLessons = [...(form.lessons || []), currentSessionData];
    }

    setForm({ ...form, lessons: updatedLessons });
    setShowSessionModal(false);
    setEditingSessionIndex(null);
    setCurrentSessionData({
      num: 1,
      title: "",
      duration: ""
    });
  };

  const deleteSession = (index) => {
    const updated = form.lessons.filter((_, i) => i !== index);
    const renumbered = updated.map((lesson, i) => ({ ...lesson, num: i + 1 }));
    setForm({ ...form, lessons: renumbered });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this tile?")) return;
    const token = localStorage.getItem("bhava_token");
    const res = await fetch(`${API_BASE}/api/admin/tiles/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json();
    if (json.success) fetchTiles(); else alert(json.message || "Error");
  };

  const logout = () => { localStorage.removeItem("bhava_token"); navigate("/login"); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f4f0" }}>
      {/* TOP NAV */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "12px 20px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <h2 style={{ margin: 0, color: "#4A0B1D" }}>Admin Dashboard - {activeCategory}</h2>
          <span style={{ color: "#4A0B1D", fontWeight: 700 }}>Tiles</span>
          <Link to="/quotes" style={{ color: "#E07B39", fontWeight: 600, textDecoration: "none" }}>Quotes</Link>
        </div>
        <button onClick={logout} style={{ padding: "8px 16px", background: "#E07B39", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Logout</button>
      </div>

      {/* LEFT SIDEBAR - CATEGORIES */}
      <aside style={{ width: 200, background: "#f7f4f0", padding: "80px 12px 20px", borderRight: "1px solid #e0e0e0", overflowY: "auto", maxHeight: "100vh" }}>
        <h3 style={{ marginTop: 0, color: "#4A0B1D", fontSize: 14 }}>Categories</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {categories.map(c => (
            <li key={c} onClick={() => { setActiveCategory(c); setSelectedTile(null); setEditingId(null); }} style={{ cursor: 'pointer', padding: "10px 12px", background: c === activeCategory ? "#E07B39" : 'transparent', color: c === activeCategory ? '#fff' : '#000', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>{c}</li>
          ))}
        </ul>
      </aside>

      {/* CENTER - TILE GRID */}
      <main style={{ flex: 1, padding: "80px 20px 20px", overflowY: "auto", maxHeight: "100vh" }}>
        {loading && <div style={{ padding: 12, background: '#fffbe6', borderRadius: 6, marginBottom: 12 }}>Loading tiles…</div>}
        {error && <div style={{ padding: 12, background: '#ffe6e6', color: '#900', borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        {/* ADD NEW CONTENT SECTION */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 8, marginBottom: 20, border: "2px solid #E07B39" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#4A0B1D", fontSize: 16 }}>➕ Add New Content</h3>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: "#E07B39", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
              {showAddForm ? "✕ Close" : "✏️ Open Form"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
              setShowAddForm(false);
            }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Category */}
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Title */}
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} placeholder="Content title" />
              </div>

              {/* Subtitle */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Subtitle</label>
                <input name="subtitle" value={form.subtitle} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} placeholder="Short description" />
              </div>

              {/* Badge */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Badge Text</label>
                <input name="badgeText" value={form.badgeText} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} placeholder="e.g., 6 sessions" />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Duration</label>
                <input name="duration" value={form.duration} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} placeholder="e.g., 8 min" />
              </div>

              {/* Summary */}
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Summary</label>
                <textarea name="summary" value={form.summary} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13, minHeight: 60, resize: "vertical" }} placeholder="Quick overview" />
              </div>

              {/* Full Description */}
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>Full Description</label>
                <textarea name="fullDescription" value={form.fullDescription} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ddd", fontSize: 13, minHeight: 80, resize: "vertical" }} placeholder="Rich detailed content..." />
              </div>

              {/* Image Upload */}
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>📸 Tile Image</label>
                <div style={{ background: "#f5f5f5", border: "2px dashed #ddd", borderRadius: 8, padding: 12, marginBottom: 12, textAlign: "center" }}>
                  {imagePreview ? (
                    <>
                      <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>New Image Preview:</p>
                      <img src={imagePreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 6 }} />
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "#999" }}>No image selected</p>
                  )}
                </div>
                <label style={{ 
                  display: "block", 
                  background: "#E07B39", 
                  color: "#fff", 
                  padding: "10px 16px", 
                  borderRadius: 6, 
                  cursor: "pointer", 
                  textAlign: "center", 
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 12
                }}>
                  🖼️ Click to Upload Image
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
                {image && <p style={{ margin: 0, fontSize: 11, color: "#E07B39", fontWeight: 600 }}>✓ Image selected: {image.name}</p>}
              </div>

              {/* Submit Button */}
              <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: "#4CAF50", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>✓ Create Content</button>
                <button type="button" onClick={() => {
                  setShowAddForm(false);
                  setForm({ title: "", subtitle: "", badgeText: "", duration: "", summary: "", fullDescription: "", lessons: [], category: activeCategory });
                  setImage(null);
                  setImagePreview(null);
                }} style={{ flex: 1, padding: 12, background: "#f0f0f0", color: "#333", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
              </div>

              {/* Sessions Section */}
              <div style={{ gridColumn: "1 / span 2", borderTop: "2px solid #f0f0f0", paddingTop: 16, marginTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "#4A0B1D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Sessions ({form.lessons?.length || 0})
                  <button type="button" onClick={() => openSessionModal()} style={{ padding: "6px 12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>+ Add Session</button>
                </h4>
                
                <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: 4, padding: 8, background: "#fafafa" }}>
                  {form.lessons?.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#999", textAlign: "center", padding: 12 }}>No sessions yet</p>
                  ) : (
                    form.lessons.map((lesson, idx) => (
                      <div key={idx} style={{ background: "#fff", padding: 10, marginBottom: 8, borderRadius: 4, border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px 0", fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>
                            {lesson.num}. {lesson.title}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "#666" }}>⏱️ {lesson.duration}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => openSessionModal(idx)} style={{ padding: "4px 8px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Edit</button>
                          <button type="button" onClick={() => deleteSession(idx)} style={{ padding: "4px 8px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <h3 style={{ marginTop: 0, color: "#4A0B1D" }}>Click image to edit content</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
          {tiles.map(t => (
            <div key={t._id} onClick={() => handleEdit(t)} style={{ 
              border: editingId === t._id ? "3px solid #E07B39" : "1px solid #ddd", 
              padding: 12, 
              borderRadius: 8, 
              cursor: "pointer", 
              transition: "all 0.2s",
              background: editingId === t._id ? "#fff3e8" : "#fff",
              boxShadow: editingId === t._id ? "0 4px 12px rgba(224,123,57,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.imageUrl && <img src={(import.meta.env.VITE_API_URL || '') + t.imageUrl} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />}
              <h4 style={{ margin: "8px 0 4px 0", fontSize: 14 }}>{t.title}</h4>
              <p style={{ color: "#666", fontSize: 12, margin: 0 }}>{t.subtitle}</p>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} style={{ marginTop: 8, padding: "6px 12px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Delete</button>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT PANEL - DETAIL EDITOR */}
      {editingId && (
        <aside style={{ width: 400, background: "#fff", borderLeft: "1px solid #e0e0e0", overflowY: "auto", maxHeight: "100vh", padding: "80px 16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#4A0B1D" }}>Edit Content</h3>
            <button onClick={() => { setEditingId(null); setSelectedTile(null); setForm({ ...form, title: "", subtitle: "", badgeText: "", duration: "", summary: "", fullDescription: "", lessons: [] }); setImage(null); setImagePreview(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Subtitle</label>
              <input name="subtitle" value={form.subtitle} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Badge Text</label>
              <input name="badgeText" value={form.badgeText} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Duration</label>
              <input name="duration" value={form.duration} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }} />
            </div>

             <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Summary</label>
              <textarea name="summary" value={form.summary} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13, minHeight: 60, resize: "vertical" }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Full Description</label>
              <textarea name="fullDescription" value={form.fullDescription} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontSize: 13, minHeight: 80, resize: "vertical" }} placeholder="Rich detailed content for this tile..." />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "#4A0B1D" }}>📸 Tile Image</label>
              
              {/* Current Image Preview */}
              <div style={{ background: "#f5f5f5", border: "2px dashed #ddd", borderRadius: 8, padding: 12, marginBottom: 12, textAlign: "center" }}>
                {imagePreview ? (
                  <>
                    <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>New Image Preview:</p>
                    <img src={imagePreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 6 }} />
                  </>
                ) : selectedTile?.imageUrl ? (
                  <>
                    <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>Current Image:</p>
                    <img src={(import.meta.env.VITE_API_URL || '') + selectedTile.imageUrl} alt="current" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 6 }} />
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#999" }}>No image yet</p>
                )}
              </div>

              {/* Upload Button - BIG AND CLEAR */}
              <label style={{ 
                display: "block", 
                background: "#E07B39", 
                color: "#fff", 
                padding: "12px 16px", 
                borderRadius: 6, 
                cursor: "pointer", 
                textAlign: "center", 
                fontWeight: 600,
                fontSize: 13,
                transition: "all 0.2s",
                border: "2px solid #E07B39"
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.background = "#c86020"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#E07B39"; }}>
                🖼️ Click to Upload/Change Image
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
              
              {image && <p style={{ margin: "8px 0 0 0", fontSize: 11, color: "#E07B39", fontWeight: 600 }}>✓ New image selected: {image.name}</p>}
            </div>

            <hr style={{ margin: "8px 0", borderColor: "#e0e0e0" }} />

            <div>
              <h4 style={{ margin: "8px 0 12px 0", fontSize: 13, color: "#4A0B1D" }}>Sessions ({form.lessons?.length || 0})</h4>
              <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: 4, padding: 8, marginBottom: 12, background: "#fafafa" }}>
                {form.lessons?.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "#999", textAlign: "center", padding: 16 }}>No sessions yet. Click add below.</p>
                ) : (
                  form.lessons.map((lesson, idx) => (
                    <div key={idx} style={{ background: "#fff", padding: 10, marginBottom: 10, borderRadius: 4, border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: "#4A0B1D" }}>
                          {lesson.num}. {lesson.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#666" }}>⏱️ {lesson.duration}</p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => openSessionModal(idx)} style={{ padding: "6px 12px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Edit</button>
                        <button type="button" onClick={() => deleteSession(idx)} style={{ padding: "6px 10px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={() => openSessionModal()} style={{ width: "100%", padding: 12, background: "#4CAF50", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, marginBottom: 12, fontWeight: 600, transition: "all 0.2s" }} 
              onMouseEnter={(e) => e.target.style.background = "#45a049"}
              onMouseLeave={(e) => e.target.style.background = "#4CAF50"}>
                ✏️ + Add New Session
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ flex: 1, padding: 10, background: "#E07B39", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>Save Content</button>
            </div>
          </form>
        </aside>
      )}

      {/* SESSION MODAL */}
      {showSessionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 8, width: "90%", maxWidth: 500, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#4A0B1D" }}>
                {editingSessionIndex !== null ? `Edit Session ${currentSessionData.num}` : `Add New Session`}
              </h2>
              <button onClick={() => setShowSessionModal(false)} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#999" }}>✕</button>
            </div>

            <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#4A0B1D" }}>Session Title *</label>
                <input 
                  type="text"
                  value={currentSessionData.title}
                  onChange={(e) => setCurrentSessionData({ ...currentSessionData, title: e.target.value })}
                  style={{ width: "100%", padding: 12, borderRadius: 4, border: "1px solid #ddd", fontSize: 14 }}
                  placeholder="e.g., What is Bhakti?"
                  autoFocus
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#4A0B1D" }}>Duration *</label>
                <input 
                  type="text"
                  value={currentSessionData.duration}
                  onChange={(e) => setCurrentSessionData({ ...currentSessionData, duration: e.target.value })}
                  style={{ width: "100%", padding: 12, borderRadius: 4, border: "1px solid #ddd", fontSize: 14 }}
                  placeholder="e.g., 12 min"
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button 
                  type="button"
                  onClick={saveSession}
                  style={{ flex: 1, padding: 12, background: "#4CAF50", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  ✓ Save Session
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  style={{ flex: 1, padding: 12, background: "#f0f0f0", color: "#333", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
