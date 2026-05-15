import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getToken, removeToken } from '../api/axios';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'bookings', label: 'Bookings', icon: '📋' },
  { id: 'trips', label: 'Manage Trips', icon: '🗺️' },
  { id: 'cabs', label: 'Manage Cabs', icon: '🚖' },
  { id: 'logs', label: 'Security Logs', icon: '🔒' },
];

const EMPTY_TRIP = {
  title: '', location: '', category: 'wildlife',
  price: '', max_capacity: '', duration: '',
  image_url: '', description: '', available: true,
};

const EMPTY_CAB = {
  name: '', category: 'Sedan', price: '', max_capacity: '',
  image_url: '', description: '', available: true,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [tripForm, setTripForm] = useState(EMPTY_TRIP);
  const [editingTripId, setEditingTripId] = useState(null);
  const [showTripForm, setShowTripForm] = useState(false);

  const [cabForm, setCabForm] = useState(EMPTY_CAB);
  const [editingCabId, setEditingCabId] = useState(null);
  const [showCabForm, setShowCabForm] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const logout = () => {
    removeToken();
    navigate('/admin/login');
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, bRes, tRes, cRes, lRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/bookings'),
        api.get('/admin/trips'),
        api.get('/cabs'),
        api.get('/admin/logs'),
      ]);

      // Normalize stats — handle both field name conventions from backend
      const s = sRes.data;
      setStats({
        total:       s.total_bookings       ?? s.total       ?? 0,
        pending:     s.pending_bookings     ?? s.pending      ?? 0,
        confirmed:   s.confirmed_bookings   ?? s.confirmed    ?? 0,
        cancelled:   s.cancelled_bookings   ?? s.cancelled    ?? 0,
        revenue:     s.total_revenue        ?? s.revenue      ?? 0,
        activeTrips: s.active_trips         ?? s.activeTrips  ?? 0,
        persons:     s.total_persons        ?? s.persons      ?? 0,
      });
      setPendingCount(s.pending_bookings ?? s.pending ?? 0);

      // Handle bookings — backend may return array or { bookings: [] }
      setBookings(Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings ?? []);
      setTrips(Array.isArray(tRes.data) ? tRes.data : []);
      setCabs(Array.isArray(cRes.data) ? cRes.data : []);
      setLogs(Array.isArray(lRes.data) ? lRes.data : []);
    } catch (err) {
      console.error('loadAll error:', err.response?.status, err.response?.data, err.message);
      showToast('Failed to load data. Is backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login');
      return;
    }
    loadAll();
  }, [loadAll, navigate]);

  const updateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/admin/bookings/${id}/status`, { status });
      showToast(`Booking ${status} successfully`);
      await loadAll();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleImageUpload = async (e, setFormState) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormState((p) => ({ ...p, image_url: res.data.url }));
      showToast('Image uploaded successfully');
    } catch {
      showToast('Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = null;
    }
  };

  const saveTrip = async () => {
    if (!tripForm.title || !tripForm.price) {
      showToast('Title and price are required', 'error');
      return;
    }
    try {
      if (editingTripId) {
        await api.put(`/admin/trips/${editingTripId}`, tripForm);
        showToast('Trip updated successfully');
      } else {
        await api.post('/admin/trips', tripForm);
        showToast('New trip added');
      }
      setTripForm(EMPTY_TRIP);
      setEditingTripId(null);
      setShowTripForm(false);
      await loadAll();
    } catch (err) {
      console.error('saveTrip error:', err.response?.status, err.response?.data);
      showToast(err.response?.data?.error || 'Failed to save trip', 'error');
    }
  };

  const editTrip = (trip) => {
    setTripForm({ ...trip });
    setEditingTripId(trip.id);
    setShowTripForm(true);
    setTimeout(() => document.getElementById('tripFormTop')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleTrip = async (id) => {
    try {
      await api.patch(`/admin/trips/${id}/toggle`);
      showToast('Availability updated');
      await loadAll();
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const deleteTrip = async (id) => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/trips/${id}`);
      showToast('Trip deleted');
      await loadAll();
    } catch {
      showToast('Failed to delete trip', 'error');
    }
  };

  const saveCab = async () => {
    if (!cabForm.name || !cabForm.price) {
      showToast('Name and price are required', 'error');
      return;
    }
    try {
      if (editingCabId) {
        await api.put(`/cabs/${editingCabId}`, cabForm);
        showToast('Cab updated successfully');
      } else {
        await api.post('/cabs', cabForm);
        showToast('New cab added');
      }
      setCabForm(EMPTY_CAB);
      setEditingCabId(null);
      setShowCabForm(false);
      await loadAll();
    } catch (err) {
      console.error('saveCab error:', err.response?.status, err.response?.data);
      showToast(err.response?.data?.error || 'Failed to save cab', 'error');
    }
  };

  const editCab = (cab) => {
    setCabForm({ ...cab });
    setEditingCabId(cab.id);
    setShowCabForm(true);
    setTimeout(() => document.getElementById('cabFormTop')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleCab = async (id) => {
    try {
      await api.patch(`/cabs/${id}/toggle`);
      showToast('Cab availability updated');
      await loadAll();
    } catch {
      showToast('Failed to update cab', 'error');
    }
  };

  const deleteCab = async (id) => {
    if (!window.confirm('Delete this cab?')) return;
    try {
      await api.delete(`/cabs/${id}`);
      showToast('Cab deleted');
      await loadAll();
    } catch {
      showToast('Failed to delete cab', 'error');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.reference?.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q);
    const matchS = !statusFilter || b.status === statusFilter;
    return matchQ && matchS;
  });

  const adminUsername = (() => {
    try {
      const token = getToken();
      if (!token) return 'Admin';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'Admin';
    } catch {
      return 'Admin';
    }
  })();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060e06' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#0b170b',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
      }}>
        <div style={{ padding: '0 20px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#5ec96c', fontWeight: 600 }}>🌿 Admin</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--soft)', marginTop: 3 }}>Ayyappa Tours</div>
        </div>

        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '12px 20px', width: '100%',
              background: tab === t.id ? 'rgba(94,201,108,0.08)' : 'transparent',
              border: 'none', borderLeft: `2px solid ${tab === t.id ? '#5ec96c' : 'transparent'}`,
              color: tab === t.id ? '#5ec96c' : 'rgba(255,255,255,0.5)',
              fontSize: '0.88rem', cursor: 'pointer', transition: '0.2s',
              fontFamily: "'Outfit', sans-serif", textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>{t.icon}</span>
            {t.label}
            {t.id === 'bookings' && pendingCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'rgba(212,168,67,0.18)',
                color: '#d4a843', fontSize: '0.68rem', padding: '2px 7px',
                borderRadius: 10,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5ec96c', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--soft)' }}>{adminUsername}</span>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#f87171', padding: '9px',
              borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif", transition: '0.2s',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: 32, minHeight: '100vh' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <section>
            <PageHeader
              title="Dashboard Overview"
              sub={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--soft)' }}>Loading stats…</div>
              ) : stats ? (
                <>
                  <StatCard icon="📋" val={stats.total}       label="Total Bookings" />
                  <StatCard icon="⏳" val={stats.pending}     label="Pending"        color="#d4a843" />
                  <StatCard icon="✅" val={stats.confirmed}   label="Confirmed"      color="#5ec96c" />
                  <StatCard icon="💰" val={`₹${(Number(stats.revenue) / 1000).toFixed(0)}K`} label="Revenue" color="#5ec96c" />
                  <StatCard icon="🗺️" val={stats.activeTrips} label="Active Trips" />
                </>
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#f87171' }}>
                  Failed to load stats. Check if backend is running.
                </div>
              )}
            </div>

            <TableCard title="Recent Bookings" action={<Btn onClick={() => setTab('bookings')}>View All →</Btn>}>
              <BookingsTable bookings={bookings.slice(0, 5)} compact onUpdate={updateBookingStatus} />
            </TableCard>
          </section>
        )}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <section>
            <PageHeader title="All Bookings" sub="Manage and update booking status" />
            <TableCard
              title="Bookings"
              action={
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-input"
                    placeholder="Search name or reference…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 210, padding: '8px 14px', fontSize: '0.82rem' }}
                  />
                  <select
                    className="form-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 140, padding: '8px 12px', fontSize: '0.82rem' }}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              }
            >
              <BookingsTable bookings={filteredBookings} onUpdate={updateBookingStatus} />
            </TableCard>
          </section>
        )}

        {/* ── TRIPS ── */}
        {tab === 'trips' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <PageHeader title="Manage Trips" sub="Add, edit, or toggle availability of packages" noMargin />
              <Btn onClick={() => { setShowTripForm((p) => !p); setTripForm(EMPTY_TRIP); setEditingTripId(null); }}>
                {showTripForm ? 'Cancel' : '+ Add New Package'}
              </Btn>
            </div>

            {showTripForm && (
              <div id="tripFormTop" style={{
                background: '#142114', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: 26, marginBottom: 22,
              }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', marginBottom: 18 }}>
                  {editingTripId ? 'Edit Package' : 'Add New Package'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                  {[
                    { key: 'title',        label: 'Title',                  placeholder: 'Package title' },
                    { key: 'location',     label: 'Location',               placeholder: 'e.g. Munnar, Kerala' },
                    { key: 'duration',     label: 'Duration',               placeholder: '3 Days / 2 Nights' },
                    { key: 'price',        label: 'Price per Person (₹)',   placeholder: '8500', type: 'number' },
                    { key: 'max_capacity', label: 'Max Capacity',           placeholder: '20',   type: 'number' },
                  ].map((f) => (
                    <div key={f.key} className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        type={f.type || 'text'}
                        placeholder={f.placeholder}
                        value={tripForm[f.key]}
                        onChange={(e) => setTripForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={tripForm.category}
                      onChange={(e) => setTripForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      {['wildlife', 'backwater', 'hillstation', 'beach', 'cultural'].map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://..."
                      value={tripForm.image_url}
                      onChange={(e) => setTripForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                    <label style={{
                      background: 'rgba(255,255,255,0.1)', color: '#fff',
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', fontSize: '0.85rem',
                    }}>
                      {uploadingImage ? 'Uploading...' : '📁 Upload'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, setTripForm)} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Package description…"
                    value={tripForm.description}
                    onChange={(e) => setTripForm((p) => ({ ...p, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={saveTrip}
                  style={{
                    background: '#5ec96c', color: '#060e06', border: 'none',
                    padding: '12px 20px', borderRadius: 8, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: 10,
                  }}
                >
                  Save Package
                </button>
              </div>
            )}

            <TableCard title="All Packages">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--soft)' }}>Loading…</div>
              ) : trips.length === 0 ? (
                <EmptyState text="No trips yet. Add one above!" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <THead cols={['Image', 'Title', 'Location', 'Category', 'Price', 'Capacity', 'Status', 'Actions']} />
                  <tbody>
                    {trips.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}
                      >
                        <Td>
                          {t.image_url
                            ? <img src={t.image_url} alt={t.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            : <span style={{ color: 'var(--soft)', fontSize: '0.75rem' }}>No img</span>
                          }
                        </Td>
                        <Td><span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{t.title}</span></Td>
                        <Td><span style={{ color: 'var(--soft)', fontSize: '0.82rem' }}>{t.location}</span></Td>
                        <Td><span className={`badge badge-${t.category === 'wildlife' ? 'confirmed' : 'pending'}`} style={{ fontSize: '0.68rem' }}>{t.category}</span></Td>
                        <Td><span style={{ color: '#5ec96c', fontWeight: 500 }}>₹{Number(t.price).toLocaleString('en-IN')}</span></Td>
                        <Td>{t.max_capacity}</Td>
                        <Td><span className={`badge badge-${t.available ? 'confirmed' : 'cancelled'}`}>{t.available ? 'Active' : 'Hidden'}</span></Td>
                        <Td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn color="#5ec96c" onClick={() => editTrip(t)}>✏️ Edit</ActionBtn>
                            <ActionBtn color="rgba(255,255,255,0.5)" onClick={() => toggleTrip(t.id)}>
                              {t.available ? '🙈 Hide' : '👁 Show'}
                            </ActionBtn>
                            <ActionBtn color="#f87171" onClick={() => deleteTrip(t.id)}>🗑 Delete</ActionBtn>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableCard>
          </section>
        )}

        {/* ── CABS ── */}
        {tab === 'cabs' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <PageHeader title="Manage Cabs" sub="Add, edit, or toggle availability of cabs and vehicles" noMargin />
              <Btn onClick={() => { setShowCabForm((p) => !p); setCabForm(EMPTY_CAB); setEditingCabId(null); }}>
                {showCabForm ? 'Cancel' : '+ Add New Cab'}
              </Btn>
            </div>

            {showCabForm && (
              <div id="cabFormTop" style={{
                background: '#142114', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: 26, marginBottom: 22,
              }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', marginBottom: 18 }}>
                  {editingCabId ? 'Edit Cab' : 'Add New Cab'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                  {[
                    { key: 'name',         label: 'Vehicle Name', placeholder: 'e.g. Swift Dzire' },
                    { key: 'price',        label: 'Price (₹)',    placeholder: '2000', type: 'number' },
                    { key: 'max_capacity', label: 'Max Seats',    placeholder: '4',    type: 'number' },
                  ].map((f) => (
                    <div key={f.key} className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        type={f.type || 'text'}
                        placeholder={f.placeholder}
                        value={cabForm[f.key]}
                        onChange={(e) => setCabForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={cabForm.category}
                      onChange={(e) => setCabForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      {['Sedan', 'SUV', 'Hatchback', 'Traveller', 'Luxury'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://..."
                      value={cabForm.image_url}
                      onChange={(e) => setCabForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                    <label style={{
                      background: 'rgba(255,255,255,0.1)', color: '#fff',
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', fontSize: '0.85rem',
                    }}>
                      {uploadingImage ? 'Uploading...' : '📁 Upload'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, setCabForm)} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Vehicle description or terms…"
                    value={cabForm.description}
                    onChange={(e) => setCabForm((p) => ({ ...p, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={saveCab}
                  style={{
                    background: '#5ec96c', color: '#060e06', border: 'none',
                    padding: '12px 20px', borderRadius: 8, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: 10,
                  }}
                >
                  Save Cab
                </button>
              </div>
            )}

            <TableCard title="All Cabs">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--soft)' }}>Loading…</div>
              ) : cabs.length === 0 ? (
                <EmptyState text="No cabs yet. Add one above!" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <THead cols={['Image', 'Vehicle Name', 'Category', 'Price', 'Seats', 'Status', 'Actions']} />
                  <tbody>
                    {cabs.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(cl => cl.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(cl => cl.style.background = '')}
                      >
                        <Td>
                          {c.image_url
                            ? <img src={c.image_url} alt={c.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            : <span style={{ color: 'var(--soft)', fontSize: '0.75rem' }}>No img</span>
                          }
                        </Td>
                        <Td><span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{c.name}</span></Td>
                        <Td><span className="badge badge-pending" style={{ fontSize: '0.68rem' }}>{c.category}</span></Td>
                        <Td><span style={{ color: '#5ec96c', fontWeight: 500 }}>₹{Number(c.price).toLocaleString('en-IN')}</span></Td>
                        <Td>{c.max_capacity}</Td>
                        <Td><span className={`badge badge-${c.available ? 'confirmed' : 'cancelled'}`}>{c.available ? 'Active' : 'Hidden'}</span></Td>
                        <Td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn color="#5ec96c" onClick={() => editCab(c)}>✏️ Edit</ActionBtn>
                            <ActionBtn color="rgba(255,255,255,0.5)" onClick={() => toggleCab(c.id)}>
                              {c.available ? '🙈 Hide' : '👁 Show'}
                            </ActionBtn>
                            <ActionBtn color="#f87171" onClick={() => deleteCab(c.id)}>🗑 Delete</ActionBtn>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableCard>
          </section>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <section>
            <PageHeader title="Security Logs" sub="Admin login history and IP tracking" />
            <TableCard title="Login Activity">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--soft)' }}>Loading…</div>
              ) : logs.length === 0 ? (
                <EmptyState text="No login logs yet" />
              ) : (
                logs.map((l) => (
                  <div key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '0.85rem',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.success ? '#5ec96c' : '#f87171', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{l.username || 'Admin'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--soft)' }}>IP: {l.ip_address}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--soft)' }}>
                      {new Date(l.created_at).toLocaleString('en-IN')}
                    </span>
                    <span className={`badge badge-${l.success ? 'confirmed' : 'cancelled'}`}>
                      {l.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))
              )}
            </TableCard>
          </section>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: '#142114',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(94,201,108,0.3)'}`,
          borderRadius: 10, padding: '13px 18px', fontSize: '0.88rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.3s ease',
          minWidth: 240,
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (max-width: 1100px) {
          main { padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────

function PageHeader({ title, sub, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 28 }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 600 }}>{title}</h1>
      {sub && <p style={{ color: 'var(--soft)', fontSize: '0.85rem', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function StatCard({ icon, val, label, color }) {
  return (
    <div
      style={{
        background: '#142114', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 20, transition: '0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(94,201,108,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem', lineHeight: 1, marginBottom: 4, color: color || 'var(--text)' }}>
        {val}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--soft)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function TableCard({ title, action, children }) {
  return (
    <div style={{ background: '#142114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{
        padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function BookingsTable({ bookings, compact, onUpdate }) {
  if (!bookings || bookings.length === 0) return <EmptyState text="No bookings yet 🌿" />;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <THead cols={['Reference', 'Customer', 'Trip', 'Date', 'Persons', 'Total', 'Status', ...(!compact ? ['Actions'] : [])]} />
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <Td><code style={{ fontSize: '0.75rem', color: '#5ec96c', letterSpacing: '0.5px' }}>{b.reference || `#${b.id}`}</code></Td>
            <Td>
              <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{b.customer_name}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--soft)' }}>{b.customer_email}</div>
            </Td>
            <Td><span style={{ fontSize: '0.83rem' }}>{b.trip_title || 'N/A'}</span></Td>
            <Td>
              <span style={{ fontSize: '0.8rem' }}>
                {b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-IN') : '—'}
              </span>
            </Td>
            <Td>{b.persons}</Td>
            <Td><span style={{ color: '#5ec96c', fontWeight: 500 }}>₹{Number(b.total_price).toLocaleString('en-IN')}</span></Td>
            <Td><span className={`badge badge-${b.status}`}>{b.status}</span></Td>
            {!compact && (
              <Td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {b.status === 'pending' && (
                    <>
                      <ActionBtn color="#5ec96c" onClick={() => onUpdate(b.id, 'confirmed')}>✓ Confirm</ActionBtn>
                      <ActionBtn color="#f87171" onClick={() => onUpdate(b.id, 'cancelled')}>✕ Cancel</ActionBtn>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <ActionBtn color="#f87171" onClick={() => onUpdate(b.id, 'cancelled')}>✕ Cancel</ActionBtn>
                  )}
                  {b.status === 'cancelled' && (
                    <ActionBtn color="#5ec96c" onClick={() => onUpdate(b.id, 'confirmed')}>↺ Restore</ActionBtn>
                  )}
                </div>
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function THead({ cols }) {
  return (
    <thead>
      <tr>
        {cols.map((c) => (
          <th key={c} style={{
            padding: '11px 20px', textAlign: 'left',
            fontSize: '0.68rem', letterSpacing: '1px', textTransform: 'uppercase',
            color: 'var(--soft)', background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 500,
          }}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

function Td({ children }) {
  return <td style={{ padding: '13px 20px', fontSize: '0.85rem', transition: '0.2s' }}>{children}</td>;
}

function ActionBtn({ children, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}18`, border: `1px solid ${color}40`,
        color, padding: '5px 11px', borderRadius: 6, fontSize: '0.72rem',
        fontWeight: 500, cursor: 'pointer', transition: '0.2s',
        fontFamily: "'Outfit', sans-serif",
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}18`}
    >
      {children}
    </button>
  );
}

function Btn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(94,201,108,0.1)', border: '1px solid rgba(94,201,108,0.3)',
        color: '#5ec96c', padding: '9px 18px', borderRadius: 8,
        fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500,
        fontFamily: "'Outfit', sans-serif", transition: '0.2s',
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--soft)', fontSize: '0.9rem' }}>
      {text}
    </div>
  );
}