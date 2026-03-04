import React, { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════
//  ⚙️  CONFIGURATION — Replace these values after setup
// ════════════════════════════════════════════════════════════
const CFG = {
  SUPABASE_URL: "https://cprexncpokmepivifiup.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcmV4bmNwb2ttZXBpdmlmaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjc1NTksImV4cCI6MjA4ODIwMzU1OX0.n1MzRjXJQX3T23SKDb5OYpuersIiObAtbINDewiXolc",
  CLOUDINARY_NAME: "dysbgzoxx",
  CLOUDINARY_PRESET: "swamini_upload",
};

const ADMIN_EMAIL = "vinitakatkar33@gmail.com";
const IS_CONFIGURED = !CFG.SUPABASE_URL.includes("YOUR_PROJECT_REF");

// ════════════════════════════════════════════════════════════
//  🔌  SUPABASE CLIENT (REST API, no external library needed)
// ════════════════════════════════════════════════════════════
let _token = null;

async function sbReq(path, opts = {}) {
  const headers = {
    apikey: CFG.SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(CFG.SUPABASE_URL + path, { ...opts, headers });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || e.error_description || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function sbLogin(email, password) {
  const res = await fetch(
    `${CFG.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: CFG.SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!res.ok) throw new Error("Invalid email or password.");
  const data = await res.json();
  _token = data.access_token;
  return data.user;
}

async function sbLogout() {
  if (_token) {
    fetch(`${CFG.SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: CFG.SUPABASE_KEY, Authorization: `Bearer ${_token}` },
    }).catch(() => { });
    _token = null;
  }
}

const API = {
  list: () => sbReq("/rest/v1/products?select=*&order=created_at.desc"),
  create: (d) => sbReq("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(d) }),
  update: (id, d) => sbReq(`/rest/v1/products?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(d) }),
  remove: (id) => sbReq(`/rest/v1/products?id=eq.${id}`, { method: "DELETE" }),
};

// ════════════════════════════════════════════════════════════
//  ☁️  CLOUDINARY UPLOAD
// ════════════════════════════════════════════════════════════
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CFG.CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CFG.CLOUDINARY_NAME}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error("Image upload failed. Check your Cloudinary config.");
  return (await res.json()).secure_url;
}

// ════════════════════════════════════════════════════════════
//  🎨  GLOBAL STYLES
// ════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --maroon:       #6B1E26;
    --maroon-dark:  #3E0C13;
    --gold:         #C4952A;
    --gold-light:   #E8BE60;
    --cream:        #FBF5E8;
    --cream-dark:   #F0E4CC;
    --text:         #1C0A05;
    --text-muted:   #7A5540;
    --green:        #2D7A4F;
    --red:          #C0392B;
    --shadow:       0 4px 24px rgba(60,10,20,0.10);
    --shadow-lg:    0 12px 48px rgba(60,10,20,0.18);
    --radius:       10px;
  }

  html, body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--text); min-height: 100vh; }

  /* ── HEADER ── */
  .hdr {
    background: var(--maroon-dark);
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
    position: sticky;
    top: 0;
    z-index: 200;
    box-shadow: 0 2px 20px rgba(0,0,0,.4);
  }
  .hdr-brand { line-height: 1.15; }
  .hdr-name  { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--gold-light); letter-spacing: .05em; }
  .hdr-tag   { font-size: .58rem; color: rgba(255,255,255,.4); letter-spacing: .22em; text-transform: uppercase; }
  .hdr-right { display: flex; align-items: center; gap: .75rem; }

  /* ── BUTTONS ── */
  .btn {
    padding: .5rem 1.25rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: .85rem;
    font-weight: 500;
    transition: all .18s;
    white-space: nowrap;
  }
  .btn:disabled { opacity: .55; cursor: not-allowed; }
  .btn-gold     { background: var(--gold); color: #fff; }
  .btn-gold:hover:not(:disabled)    { background: var(--gold-light); color: var(--text); }
  .btn-outline  { background: transparent; color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.3); }
  .btn-outline:hover:not(:disabled) { background: rgba(255,255,255,.12); color: #fff; }
  .btn-primary  { background: var(--maroon); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--maroon-dark); }
  .btn-secondary { background: var(--cream-dark); color: var(--text); border: 1px solid #d0bea0; }
  .btn-secondary:hover:not(:disabled) { background: #e0ceae; }
  .btn-danger   { background: var(--red); color: #fff; }
  .btn-danger:hover:not(:disabled)  { background: #a93226; }
  .btn-sm { padding: .3rem .75rem; font-size: .78rem; }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(135deg, var(--maroon-dark) 0%, var(--maroon) 55%, #8B3040 100%);
    padding: 4rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C4952A' fill-opacity='0.07'%3E%3Cpath d='M40 0L80 40L40 80L0 40z'/%3E%3C/g%3E%3C/svg%3E");
  }
  .hero-inner { position: relative; }
  .hero h1    { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem,5vw,3.2rem); font-weight: 300; color: var(--cream); letter-spacing: .08em; }
  .hero h1 em { font-style: italic; color: var(--gold-light); }
  .hero-line  { width: 64px; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); margin: 1rem auto; }
  .hero-sub   { color: rgba(251,245,232,.6); font-size: .78rem; letter-spacing: .2em; text-transform: uppercase; }

  /* ── CATALOG ── */
  .section-hd    { text-align: center; padding: 2.5rem 2rem 1.5rem; }
  .section-hd h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 400; color: var(--maroon); }
  .section-hd p  { color: var(--text-muted); font-size: .82rem; margin-top: .3rem; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.5rem; padding: 0 2rem 3rem; max-width: 1400px; margin: 0 auto; }

  .card { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform .25s, box-shadow .25s; }
  .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .card-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: var(--cream-dark); }
  .card-ph  { width: 100%; aspect-ratio: 3/4; background: linear-gradient(135deg, var(--cream-dark), var(--cream)); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--text-muted); }
  .card-body { padding: 1rem 1.1rem 1.2rem; border-top: 1px solid var(--cream-dark); }
  .card-name  { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 500; color: var(--text); margin-bottom: .35rem; line-height: 1.3; }
  .card-price { font-size: .95rem; font-weight: 500; color: var(--maroon); margin-bottom: .5rem; }

  /* ── BADGES ── */
  .badge       { display: inline-block; padding: .18rem .58rem; border-radius: 20px; font-size: .7rem; font-weight: 500; letter-spacing: .04em; }
  .badge-avail { background: #E8F5EE; color: var(--green); border: 1px solid #C8E6D4; }
  .badge-sold  { background: #FDEEEC; color: var(--red);   border: 1px solid #F5C8C2; }

  /* ── STATES ── */
  .loading, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; gap: 1rem; color: var(--text-muted); text-align: center; }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--cream-dark); border-top-color: var(--maroon); border-radius: 50%; animation: spin .75s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── OVERLAY / MODAL ── */
  .overlay { position: fixed; inset: 0; background: rgba(28,10,5,.62); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(3px); }
  .modal { background: #fff; border-radius: 14px; padding: 2rem; width: 100%; max-width: 470px; box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 500; color: var(--maroon); margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--cream-dark); }

  /* ── FORM ── */
  .form-group { margin-bottom: 1rem; }
  .flabel { display: block; font-size: .73rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: .09em; margin-bottom: .35rem; }
  .finput, .fselect { width: 100%; padding: .62rem .85rem; border: 1.5px solid #DDD0BC; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: .9rem; color: var(--text); background: var(--cream); transition: border-color .2s; outline: none; }
  .finput:focus, .fselect:focus { border-color: var(--gold); }

  .upload-zone { border: 2px dashed #DDD0BC; border-radius: 8px; padding: 1.2rem; text-align: center; cursor: pointer; transition: all .2s; background: var(--cream); }
  .upload-zone:hover { border-color: var(--gold); background: #FBF5E0; }
  .upload-preview { width: 100%; max-height: 155px; object-fit: cover; border-radius: 6px; margin-bottom: .5rem; display: block; }
  .upload-text { font-size: .82rem; color: var(--text-muted); }
  .upload-hint { font-size: .7rem; color: #bbb; margin-top: .2rem; }

  .modal-actions { display: flex; gap: .75rem; margin-top: 1.5rem; justify-content: flex-end; }
  .err { background: #FDEEEC; color: var(--red);   padding: .62rem .85rem; border-radius: 6px; font-size: .83rem; margin-bottom: 1rem; border: 1px solid #F5C8C2; }
  .suc { background: #E8F5EE; color: var(--green); padding: .62rem .85rem; border-radius: 6px; font-size: .83rem; margin-bottom: 1rem; }

  /* ── ADMIN ── */
  .adm-wrap { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .adm-hdr  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--cream-dark); flex-wrap: wrap; gap: 1rem; }
  .adm-hdr h2 { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 500; color: var(--maroon); }
  .adm-hdr p  { font-size: .82rem; color: var(--text-muted); margin-top: .25rem; }
  .adm-actions { display: flex; gap: .6rem; flex-wrap: wrap; }

  .tbl-wrap { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); overflow: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 580px; }
  th { padding: .85rem 1.1rem; text-align: left; font-size: .72rem; font-weight: 500; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); background: var(--cream); border-bottom: 1px solid var(--cream-dark); white-space: nowrap; }
  td { padding: .85rem 1.1rem; border-bottom: 1px solid var(--cream-dark); font-size: .88rem; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #FFFBF5; }
  .tbl-img { width: 52px; height: 52px; object-fit: cover; border-radius: 6px; border: 1px solid var(--cream-dark); display: block; }
  .tbl-ph  { width: 52px; height: 52px; border-radius: 6px; background: var(--cream-dark); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
  .tbl-act { display: flex; gap: .5rem; }
  .tbl-empty { text-align: center; padding: 3.5rem; color: var(--text-muted); }

  /* ── CONFIRM ── */
  .confirm { text-align: center; max-width: 340px; }
  .confirm-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .confirm h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; margin-bottom: .4rem; }
  .confirm p  { color: var(--text-muted); font-size: .88rem; margin-bottom: 1.5rem; }

  /* ── MISC ── */
  .setup-banner { background: #FFF9E6; border-bottom: 1px solid #EDD860; padding: .75rem 2rem; text-align: center; font-size: .82rem; color: #856400; }
  .footer { text-align: center; padding: 2rem; border-top: 1px solid var(--cream-dark); color: var(--text-muted); font-size: .75rem; letter-spacing: .05em; }

  @media (max-width: 640px) {
    .hero h1  { font-size: 1.8rem; }
    .grid     { padding: 0 1rem 2rem; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .adm-wrap { padding: 1rem; }
    .hdr      { padding: 0 1rem; }
    .hdr-name { font-size: 1.25rem; }
  }
`;

// ════════════════════════════════════════════════════════════
//  🧩  COMPONENTS
// ════════════════════════════════════════════════════════════

/** Single product card (visitor view) */
function ProductCard({ p }) {
  return (
    <div className="card">
      {p.image_url
        ? <img className="card-img" src={p.image_url} alt={p.name} loading="lazy" />
        : <div className="card-ph">🪡</div>
      }
      <div className="card-body">
        <div className="card-name">{p.name}</div>
        <div className="card-price">₹{Number(p.price).toLocaleString("en-IN")}</div>
        <span className={`badge ${p.status === "Available" ? "badge-avail" : "badge-sold"}`}>
          {p.status}
        </span>
      </div>
    </div>
  );
}

/** Add / Edit product form (modal) */
function ProductFormModal({ product, onClose, onSaved }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [status, setStatus] = useState(product?.status || "Available");
  const [imgUrl, setImgUrl] = useState(product?.image_url || "");
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState(product?.image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const isEdit = !!product;

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!name.trim()) return setError("Product name is required.");
    if (!price || isNaN(price) || Number(price) <= 0) return setError("Enter a valid price.");
    if (!isEdit && !imgFile && !imgUrl) return setError("Please select a product image.");

    setSaving(true);
    setError("");
    try {
      let url = imgUrl;
      if (imgFile) url = await uploadToCloudinary(imgFile);

      const payload = {
        name: name.trim(),
        price: Number(price),
        status,
        ...(url ? { image_url: url } : {}),
      };
      isEdit ? await API.update(product.id, payload) : await API.create({ ...payload, image_url: url });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? "✏️ Edit Product" : "➕ Add New Product"}</div>
        {error && <div className="err">{error}</div>}

        <div className="form-group">
          <label className="flabel">Product Name *</label>
          <input className="finput" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Banarasi Silk Saree" />
        </div>

        <div className="form-group">
          <label className="flabel">Price (₹) *</label>
          <input className="finput" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4500" min="1" />
        </div>

        <div className="form-group">
          <label className="flabel">Status</label>
          <select className="fselect" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Available">Available</option>
            <option value="Sold Out">Sold Out</option>
          </select>
        </div>

        <div className="form-group">
          <label className="flabel">Product Image {!isEdit && "*"}</label>
          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            {preview
              ? <img className="upload-preview" src={preview} alt="preview" />
              : <div style={{ padding: "1rem 0", fontSize: "2rem" }}>📷</div>
            }
            <div className="upload-text">{preview ? "Click to change image" : "Click to upload image"}</div>
            <div className="upload-hint">JPEG · PNG · WebP — max 10 MB</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Delete confirmation modal */
function ConfirmModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="overlay">
      <div className="modal confirm">
        <div className="confirm-icon">🗑️</div>
        <h3>Delete Product?</h3>
        <p>
          Are you sure you want to delete <strong>"{product.name}"</strong>?
          <br />This action cannot be undone.
        </p>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Admin login modal */
function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) return setError("Please enter email and password.");
    setLoading(true);
    setError("");
    try {
      const user = await sbLogin(email, password);
      if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await sbLogout();
        throw new Error("Access denied. This panel is for admins only.");
      }
      onLogin(user);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") login(); };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">🔐 Admin Login</div>
        {error && <div className="err">{error}</div>}

        <div className="form-group">
          <label className="flabel">Email</label>
          <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" onKeyDown={onKey} autoFocus />
        </div>

        <div className="form-group">
          <label className="flabel">Password</label>
          <input className="finput" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={onKey} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-gold" onClick={login} disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Admin dashboard with full CRUD table */
function AdminPanel({ onLogout, onViewCatalog }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await API.list();
      setProducts(data || []);
    } catch (e) {
      setError("Failed to load products: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError("Delete failed: " + e.message);
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditProduct(null); setShowForm(true); };
  const openEdit = (p) => { setEditProduct(p); setShowForm(true); };
  const onSaved = () => { setShowForm(false); setEditProduct(null); load(); };

  return (
    <div className="adm-wrap">
      <div className="adm-hdr">
        <div>
          <h2>Admin Dashboard</h2>
          <p>
            Swamini Collections ·{" "}
            {loading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="adm-actions">
          <button className="btn btn-secondary" onClick={onViewCatalog}>← View Catalog</button>
          <button className="btn btn-gold" onClick={openAdd}>+ Add Product</button>
          <button className="btn btn-primary" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="err" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div className="tbl-wrap">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="tbl-empty">
            <p style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>No products yet.</p>
            <button className="btn btn-gold" onClick={openAdd}>Add First Product</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url
                      ? <img className="tbl-img" src={p.image_url} alt={p.name} />
                      : <div className="tbl-ph">🪡</div>
                    }
                  </td>
                  <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 500 }}>
                    {p.name}
                  </td>
                  <td style={{ color: "var(--maroon)", fontWeight: 500 }}>
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span className={`badge ${p.status === "Available" ? "badge-avail" : "badge-sold"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="tbl-act">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="btn btn-danger    btn-sm" onClick={() => setDeleteTarget(p)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={onSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

/** Public-facing product catalog */
function CatalogView({ products, loading, error }) {
  return (
    <>
      <div className="hero">
        <div className="hero-inner">
          <h1>Swamini <em>Collections</em></h1>
          <div className="hero-line" />
          <p className="hero-sub">Handpicked Sarees · Timeless Elegance</p>
        </div>
      </div>

      <div className="section-hd">
        <h2>Our Collection</h2>
        {!loading && !error && (
          <p>{products.length} exquisite saree{products.length !== 1 ? "s" : ""} · Direct from weaver to wardrobe</p>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Loading collection…</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div style={{ fontSize: "2.5rem" }}>⚠️</div>
          <p style={{ fontWeight: 500 }}>Unable to load products</p>
          <p style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>
            {IS_CONFIGURED ? error : "Please fill in your Supabase & Cloudinary credentials in CFG."}
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "2.5rem" }}>🪡</div>
          <p>No products yet — check back soon!</p>
        </div>
      ) : (
        <div className="grid">
          {products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  🚀  ROOT APP
// ════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("catalog"); // "catalog" | "admin"
  const [admin, setAdmin] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inject global styles once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Fetch products for visitor view
  const loadProducts = async () => {
    if (!IS_CONFIGURED) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await API.list();
      setProducts(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const onLogin = (user) => { setAdmin(user); setShowLogin(false); setView("admin"); };
  const onLogout = async () => { await sbLogout(); setAdmin(null); setView("catalog"); loadProducts(); };

  // ─── Admin view ──────────────────────────────────────────
  if (view === "admin" && admin) {
    return (
      <>
        {!IS_CONFIGURED && (
          <div className="setup-banner">
            ⚙️ <strong>Setup needed:</strong> Fill in your Supabase URL, Anon Key, Cloudinary Cloud Name & Upload Preset in the CFG object at the top of this file.
          </div>
        )}
        <header className="hdr">
          <div className="hdr-brand">
            <div className="hdr-name">Swamini Collections</div>
            <div className="hdr-tag">Admin Panel</div>
          </div>
        </header>

        <AdminPanel onLogout={onLogout} onViewCatalog={() => { setView("catalog"); loadProducts(); }} />

        <footer className="footer">
          © {new Date().getFullYear()} Swamini Collections · Admin Portal
        </footer>
      </>
    );
  }

  // ─── Visitor / Catalog view ──────────────────────────────
  return (
    <>
      {!IS_CONFIGURED && (
        <div className="setup-banner">
          ⚙️ <strong>Setup needed:</strong> Add your Supabase &amp; Cloudinary credentials in CFG at the top of this file to go live.
        </div>
      )}

      <header className="hdr">
        <div className="hdr-brand">
          <div className="hdr-name">Swamini Collections</div>
          <div className="hdr-tag">Handpicked Sarees</div>
        </div>
        <div className="hdr-right">
          {admin
            ? <button className="btn btn-gold" onClick={() => setView("admin")}>Admin Panel</button>
            : <button className="btn btn-outline" onClick={() => setShowLogin(true)}>Admin Login</button>
          }
        </div>
      </header>

      <CatalogView products={products} loading={loading} error={error} />

      <footer className="footer">
        © {new Date().getFullYear()} Swamini Collections · All rights reserved.
      </footer>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={onLogin} />
      )}
    </>
  );
}
