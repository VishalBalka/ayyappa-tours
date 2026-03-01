import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { api } from "../api/client";
import s from "./AdminDashboard.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_COLOR = { pending: "#f59e0b", confirmed: "#22c55e", cancelled: "#ef4444" };
const CATS         = ["wildlife", "hillstation", "backwater", "beach"];
const STATUSES     = ["pending", "confirmed", "cancelled"];
const TABS         = [
  { id: "overview",    icon: "📊", label: "Overview"    },
  { id: "bookings",    icon: "📋", label: "Bookings"    },
  { id: "trips",       icon: "🌿", label: "Trips"       },
  { id: "maintenance", icon: "🔧", label: "Maintenance" },
];

const EMPTY_TRIP = {
  title: "", description: "", location: "", category: "wildlife",
  price: "", max_capacity: 10, duration: "", image_url: "", available: true,
};

// ── TripForm Modal ─────────────────────────────────────────────────────────
function TripForm({ initial, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(initial || EMPTY_TRIP);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data) => form.id
      ? api.updateTrip(form.id, data)
      : api.createTrip(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTrips"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      onClose();
    },
  });

  const submit = (e) => {
    e.preventDefault();
    mutate({ ...form, price: Number(form.price), max_capacity: Number(form.max_capacity) });
  };

  return (
    <div className={s.modalOv} onClick={onClose}>
      <motion.form
        className={s.tripForm}
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className={s.tfHead}>
          <h3>{form.id ? "Edit Trip" : "Add New Trip"}</h3>
          <button type="button" className={s.tfClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.tfBody}>
          <div className={s.tfRow}>
            <label className={s.tfField}>Title *<input required value={form.title} onChange={e => set("title", e.target.value)} /></label>
            <label className={s.tfField}>Location *<input required value={form.location} onChange={e => set("location", e.target.value)} /></label>
          </div>
          <label className={s.tfField}>
            Description *
            <textarea required rows={3} value={form.description} onChange={e => set("description", e.target.value)} />
          </label>
          <div className={s.tfRow}>
            <label className={s.tfField}>
              Category
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={s.tfField}>Duration<input value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 3 Days" /></label>
          </div>
          <div className={s.tfRow}>
            <label className={s.tfField}>Price (INR) *<input required type="number" min={0} value={form.price} onChange={e => set("price", e.target.value)} /></label>
            <label className={s.tfField}>Max Capacity<input type="number" min={1} value={form.max_capacity} onChange={e => set("max_capacity", e.target.value)} /></label>
          </div>
          <label className={s.tfField}>Image URL<input value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="https://..." /></label>
          <label className={s.tfCheck}>
            <input type="checkbox" checked={form.available} onChange={e => set("available", e.target.checked)} />
            Available for booking
          </label>
          {error && <div className={s.tfErr}>{error.message}</div>}
        </div>

        <div className={s.tfFoot}>
          <button type="button" className={s.btnSec} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnPri} disabled={isPending}>
            {isPending ? <span className={s.spin} /> : form.id ? "Update Trip" : "Create Trip"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <motion.div className={s.statCard} style={{ "--ac": color }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className={s.statIcon}>{icon}</span>
      <div>
        <span className={s.statVal}>{value}</span>
        <span className={s.statLbl}>{label}</span>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { logout } = useAuthStore();
  const [tab,      setTab]      = useState("overview");
  const [bkFilter, setBkFilter] = useState("all");
  const [tripForm, setTripForm] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);

  // ── Queries ──
  const { data: stats,    isLoading: loadStats    } = useQuery({ queryKey: ["stats"],      queryFn: api.getStats,      enabled: tab === "overview"    });
  const { data: bookings, isLoading: loadBookings } = useQuery({ queryKey: ["bookings"],   queryFn: api.getBookings,   enabled: tab === "bookings"    });
  const { data: trips,    isLoading: loadTrips    } = useQuery({ queryKey: ["adminTrips"], queryFn: api.getAdminTrips, enabled: tab === "trips"       });

  // ── Mutations ──
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.updateBookingStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const deleteTrip = useMutation({
    mutationFn: (id) => api.deleteTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTrips"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const toggleTrip = useMutation({
    mutationFn: (id) => api.toggleTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminTrips"] }),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const filteredBookings = (bookings || []).filter(b =>
    bkFilter === "all" ? true : b.status === bkFilter
  );

  return (
    <div className={`${s.dash} ${sideOpen ? s.dashOpen : ""}`}>

      {/* ── Sidebar ── */}
      <aside className={s.side}>
        <div className={s.sideLogo}>
          <span className={s.sideLeaf}>
            <svg viewBox="0 0 28 28" fill="none">
              <path d="M14 26C8 26 3 20.5 3 13.5c0-4.5 3-9 11-10.5 0 5.5-1 11 0 14.5C17 14 18 8.5 18 3c5.5 2 7 7 7 10.5C25 20.5 20 26 14 26z" fill="currentColor"/>
            </svg>
          </span>
          <div>
            <strong>Ayyappa</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className={s.sideNav}>
          {TABS.map(t => (
            <button key={t.id}
              className={`${s.sideItem} ${tab === t.id ? s.sideItemOn : ""}`}
              onClick={() => { setTab(t.id); setSideOpen(false); }}
            >
              <span className={s.sideIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={s.sideFoot}>
          <a href="/" target="_blank" rel="noopener noreferrer" className={s.sideLink}>
            🌐 View Site
          </a>
          <button className={s.sideLogout} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={s.main}>

        {/* Top bar */}
        <header className={s.topbar}>
          <button className={s.hbg} onClick={() => setSideOpen(o => !o)}>☰</button>
          <h1 className={s.topTitle}>{TABS.find(t => t.id === tab)?.label}</h1>
          <span className={s.topDate}>
            {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </span>
        </header>

        <div className={s.content}>

          {/* ── OVERVIEW ──────────────────────────────── */}
          {tab === "overview" && (
            <div>
              {loadStats ? (
                <div className={s.statsGrid}>
                  {[1,2,3,4,5,6].map(i => <div key={i} className={s.statSkel} />)}
                </div>
              ) : stats ? (
                <>
                  <div className={s.statsGrid}>
                    <StatCard icon="📋" label="Total Bookings"  value={stats.total_bookings     || 0} color="#5c9b5c" />
                    <StatCard icon="⏳" label="Pending"         value={stats.pending_bookings   || 0} color="#f59e0b" />
                    <StatCard icon="✅" label="Confirmed"       value={stats.confirmed_bookings || 0} color="#22c55e" />
                    <StatCard icon="💰" label="Revenue"         value={fmt(stats.total_revenue)}      color="#c8a84b" />
                    <StatCard icon="🌿" label="Active Trips"    value={stats.active_trips       || 0} color="#5c9b5c" />
                    <StatCard icon="👥" label="Total Travellers" value={stats.total_persons     || 0} color="#a78bfa" />
                  </div>

                  {stats.recent_bookings?.length > 0 && (
                    <div className={s.recentWrap}>
                      <h3 className={s.secTitle}>Recent Bookings</h3>
                      <div className={s.tableWrap}>
                        <table className={s.table}>
                          <thead>
                            <tr>
                              <th>Reference</th><th>Customer</th><th>Trip</th>
                              <th>Date</th><th>Total</th><th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recent_bookings.map(b => (
                              <tr key={b.id}>
                                <td><code>{b.reference}</code></td>
                                <td>{b.customer_name}</td>
                                <td>{b.trip_title || "—"}</td>
                                <td>{new Date(b.travel_date).toLocaleDateString("en-IN")}</td>
                                <td>{fmt(b.total_price)}</td>
                                <td>
                                  <span className={s.badge} style={{ "--bc": STATUS_COLOR[b.status] }}>
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={s.empty}>Could not load stats. Check server connection.</div>
              )}
            </div>
          )}

          {/* ── BOOKINGS ──────────────────────────────── */}
          {tab === "bookings" && (
            <div>
              <div className={s.toolbar}>
                <div className={s.filters}>
                  {["all", ...STATUSES].map(st => (
                    <button key={st}
                      className={`${s.filter} ${bkFilter === st ? s.filterOn : ""}`}
                      onClick={() => setBkFilter(st)}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                      <span>
                        {st === "all"
                          ? (bookings || []).length
                          : (bookings || []).filter(b => b.status === st).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {loadBookings ? <div className={s.loading}>Loading bookings…</div> :
               filteredBookings.length === 0 ? <div className={s.empty}>No bookings found.</div> : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Reference</th><th>Customer</th><th>Trip</th>
                        <th>Date</th><th>Persons</th><th>Total</th>
                        <th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td><code>{b.reference}</code></td>
                          <td>
                            <div className={s.custName}>{b.customer_name}</div>
                            <div className={s.custEmail}>{b.customer_email}</div>
                          </td>
                          <td>{b.trip_title || `Trip #${b.trip_id}`}</td>
                          <td>{new Date(b.travel_date).toLocaleDateString("en-IN")}</td>
                          <td>{b.persons}</td>
                          <td>{fmt(b.total_price)}</td>
                          <td>
                            <span className={s.badge} style={{ "--bc": STATUS_COLOR[b.status] }}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div className={s.acts}>
                              {b.status !== "confirmed" && (
                                <button className={`${s.actBtn} ${s.actOk}`}
                                  onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}>
                                  ✓
                                </button>
                              )}
                              {b.status !== "cancelled" && (
                                <button className={`${s.actBtn} ${s.actNo}`}
                                  onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TRIPS ─────────────────────────────────── */}
          {tab === "trips" && (
            <div>
              <div className={s.toolbar}>
                <span className={s.count}>{(trips || []).length} trips</span>
                <button className={s.btnPri} onClick={() => setTripForm({})}>
                  + Add Trip
                </button>
              </div>

              {loadTrips ? <div className={s.loading}>Loading trips…</div> :
               !trips?.length ? <div className={s.empty}>No trips yet. Add your first!</div> : (
                <div className={s.tripGrid}>
                  {trips.map((t, i) => (
                    <motion.div key={t.id}
                      className={`${s.tripCard} ${!t.available ? s.tripOff : ""}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className={s.tcImg}>
                        <img
                          src={t.image_url || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=60"}
                          alt={t.title}
                          onError={e => { e.target.src = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=60"; }}
                        />
                        <span className={s.tcCat}>{t.category}</span>
                      </div>
                      <div className={s.tcBody}>
                        <h4>{t.title}</h4>
                        <p>📍 {t.location}</p>
                        <div className={s.tcMeta}>
                          <span>{fmt(t.price)}/person</span>
                          {t.duration && <span>⏱ {t.duration}</span>}
                          <span>👥 max {t.max_capacity}</span>
                        </div>
                      </div>
                      <div className={s.tcFoot}>
                        <label className={s.toggle}>
                          <input type="checkbox" checked={t.available}
                            onChange={() => toggleTrip.mutate(t.id)} />
                          <span>{t.available ? "Active" : "Inactive"}</span>
                        </label>
                        <div className={s.acts}>
                          <button className={`${s.actBtn} ${s.actEd}`} onClick={() => setTripForm(t)}>✎</button>
                          <button className={`${s.actBtn} ${s.actDel}`}
                            onClick={() => window.confirm("Delete this trip?") && deleteTrip.mutate(t.id)}>
                            🗑
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MAINTENANCE ───────────────────────────── */}
          {tab === "maintenance" && (
            <div className={s.maintGrid}>
              {[
                { icon:"🌿", title:"Trip Availability",  desc:"Toggle trips visible on the public site.",              action:()=>setTab("trips"),                        label:"Manage Trips"   },
                { icon:"📋", title:"Pending Bookings",   desc:"Review and confirm or cancel pending bookings.",         action:()=>{ setBkFilter("pending"); setTab("bookings"); }, label:"View Pending" },
                { icon:"💰", title:"Pricing",            desc:"Update trip prices via the trip editor.",                action:()=>setTab("trips"),                        label:"Edit Prices"   },
                { icon:"📍", title:"Locations",          desc:"Update trip locations and destination details.",          action:()=>setTab("trips"),                        label:"Edit Trips"    },
                { icon:"📊", title:"Analytics",          desc:"View booking stats and revenue overview.",               action:()=>setTab("overview"),                     label:"View Stats"    },
                { icon:"🌐", title:"Public Site",        desc:"Open the live website and verify your changes.",         action:()=>window.open("/","_blank"),              label:"Open Site"     },
              ].map(({ icon, title, desc, action, label }) => (
                <div key={title} className={s.maintCard}>
                  <span className={s.maintIcon}>{icon}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <button className={s.btnPri} onClick={action}>{label} →</button>
                </div>
              ))}
              <div className={`${s.maintCard} ${s.maintDanger}`}>
                <span className={s.maintIcon}>🔒</span>
                <h3>Session Security</h3>
                <p>Token secured in HttpOnly cookie. Logout to end your session safely.</p>
                <button className={s.btnDanger} onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Trip Form Modal */}
      <AnimatePresence>
        {tripForm !== null && (
          <TripForm
            initial={tripForm.id ? tripForm : undefined}
            onClose={() => setTripForm(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      {sideOpen && <div className={s.backdrop} onClick={() => setSideOpen(false)} />}
    </div>
  );
}
