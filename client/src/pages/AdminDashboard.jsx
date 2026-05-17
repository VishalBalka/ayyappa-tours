import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getToken, removeToken } from '../api/axios';

const TABS = [
  { id:'overview', label:'Overview',      icon:'📊' },
  { id:'bookings', label:'Bookings',      icon:'📋' },
  { id:'places',   label:'Manage Places', icon:'📍' },
  { id:'trips',    label:'Manage Trips',  icon:'🗺️' },
  { id:'cabs',     label:'Manage Cabs',   icon:'🚖' },
  { id:'logs',     label:'Security Logs', icon:'🔒' },
];

const EMPTY_TRIP  = { title:'', location:'', category:'wildlife', max_capacity:'', duration:'', image_url:'', description:'', available:true };
const EMPTY_CAB   = { name:'', category:'Sedan', max_capacity:'', image_url:'', description:'', available:true };
const EMPTY_PLACE = { name:'', description:'', image_url:'', tag:'', sort_order:0, active:true };

const G = { bg:'#060e06', sidebar:'#0b170b', card:'#142114', border:'rgba(255,255,255,0.07)', green:'#5ec96c', soft:'rgba(255,255,255,0.45)' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips]       = useState([]);
  const [cabs, setCabs]         = useState([]);
  const [places, setPlaces]     = useState([]);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [tripForm, setTripForm]             = useState(EMPTY_TRIP);
  const [editingTripId, setEditingTripId]   = useState(null);
  const [showTripForm, setShowTripForm]     = useState(false);

  const [cabForm, setCabForm]               = useState(EMPTY_CAB);
  const [editingCabId, setEditingCabId]     = useState(null);
  const [showCabForm, setShowCabForm]       = useState(false);

  const [placeForm, setPlaceForm]             = useState(EMPTY_PLACE);
  const [editingPlaceId, setEditingPlaceId]   = useState(null);
  const [showPlaceForm, setShowPlaceForm]     = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const logout = () => { removeToken(); navigate('/admin/login'); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes,bRes,tRes,cRes,pRes,lRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/bookings'),
        api.get('/admin/trips'),
        api.get('/cabs'),
        api.get('/admin/places'),
        api.get('/admin/logs'),
      ]);
      const s = sRes.data;
      setStats({
        total:        s.total_bookings     ?? 0,
        pending:      s.pending_bookings   ?? 0,
        confirmed:    s.confirmed_bookings ?? 0,
        cancelled:    s.cancelled_bookings ?? 0,
        activeTrips:  s.active_trips       ?? 0,
        activePlaces: s.active_places      ?? 0,
      });
      setPendingCount(s.pending_bookings ?? 0);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      setTrips(Array.isArray(tRes.data)    ? tRes.data : []);
      setCabs(Array.isArray(cRes.data)     ? cRes.data : []);
      setPlaces(Array.isArray(pRes.data)   ? pRes.data : []);
      setLogs(Array.isArray(lRes.data)     ? lRes.data : []);
    } catch (err) {
      console.error('loadAll error:', err.response?.status, err.message);
      showToast('Failed to load data.','error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!getToken()) { navigate('/admin/login'); return; }
    loadAll();
  }, [loadAll, navigate]);

  const updateBookingStatus = async (id, status) => {
    try { await api.patch(`/admin/bookings/${id}/status`,{status}); showToast(`Booking ${status}`); await loadAll(); }
    catch { showToast('Failed to update','error'); }
  };

  const handleImageUpload = async (e, setFormState) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingImage(true);
    const fd = new FormData(); fd.append('image',file);
    try {
      const res = await api.post('/admin/upload', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setFormState(p=>({...p,image_url:res.data.url})); showToast('Image uploaded');
    } catch { showToast('Upload failed','error'); }
    finally { setUploadingImage(false); e.target.value=null; }
  };

  // ── Trip CRUD ─────────────────────────────────────────────────────────────
  const saveTrip = async () => {
    if (!tripForm.title) { showToast('Title required','error'); return; }
    try {
      editingTripId ? await api.put(`/admin/trips/${editingTripId}`,tripForm) : await api.post('/admin/trips',tripForm);
      showToast(editingTripId?'Trip updated':'Trip added');
      setTripForm(EMPTY_TRIP); setEditingTripId(null); setShowTripForm(false); await loadAll();
    } catch (err) { showToast(err.response?.data?.error||'Failed','error'); }
  };
  const editTrip   = (t) => { setTripForm({...t}); setEditingTripId(t.id); setShowTripForm(true); };
  const toggleTrip = async (id) => { try{await api.patch(`/admin/trips/${id}/toggle`);await loadAll();}catch{showToast('Failed','error');} };
  const deleteTrip = async (id) => { if(!confirm('Delete this trip?'))return; try{await api.delete(`/admin/trips/${id}`);showToast('Deleted');await loadAll();}catch{showToast('Failed','error');} };

  // ── Cab CRUD ──────────────────────────────────────────────────────────────
  const saveCab = async () => {
    if (!cabForm.name) { showToast('Vehicle name required','error'); return; }
    try {
      editingCabId ? await api.put(`/cabs/${editingCabId}`,cabForm) : await api.post('/cabs',cabForm);
      showToast(editingCabId?'Cab updated':'Cab added');
      setCabForm(EMPTY_CAB); setEditingCabId(null); setShowCabForm(false); await loadAll();
    } catch (err) { showToast(err.response?.data?.error||'Failed','error'); }
  };
  const editCab   = (c) => { setCabForm({...c}); setEditingCabId(c.id); setShowCabForm(true); };
  const toggleCab = async (id) => { try{await api.patch(`/cabs/${id}/toggle`);await loadAll();}catch{showToast('Failed','error');} };
  const deleteCab = async (id) => { if(!confirm('Delete this cab?'))return; try{await api.delete(`/cabs/${id}`);showToast('Deleted');await loadAll();}catch{showToast('Failed','error');} };

  // ── Place CRUD ────────────────────────────────────────────────────────────
  const savePlace = async () => {
    if (!placeForm.name) { showToast('Place name required','error'); return; }
    try {
      editingPlaceId ? await api.put(`/admin/places/${editingPlaceId}`,placeForm) : await api.post('/admin/places',placeForm);
      showToast(editingPlaceId?'Place updated':'Place added');
      setPlaceForm(EMPTY_PLACE); setEditingPlaceId(null); setShowPlaceForm(false); await loadAll();
    } catch (err) { showToast(err.response?.data?.error||'Failed','error'); }
  };
  const editPlace   = (p) => { setPlaceForm({...p}); setEditingPlaceId(p.id); setShowPlaceForm(true); };
  const togglePlace = async (id) => { try{await api.patch(`/admin/places/${id}/toggle`);await loadAll();}catch{showToast('Failed','error');} };
  const deletePlace = async (id) => { if(!confirm('Delete this place?'))return; try{await api.delete(`/admin/places/${id}`);showToast('Deleted');await loadAll();}catch{showToast('Failed','error');} };

  const filteredBookings = bookings.filter((b)=>{
    const q=search.toLowerCase();
    return (!q||b.customer_name?.toLowerCase().includes(q)||b.reference?.toLowerCase().includes(q)||b.customer_email?.toLowerCase().includes(q))
      && (!statusFilter||b.status===statusFilter);
  });

  const adminUsername = (()=>{ try{const t=getToken();return t?JSON.parse(atob(t.split('.')[1])).username||'Admin':'Admin';}catch{return'Admin';} })();

  return (
    <div style={{display:'flex',minHeight:'100vh',background:G.bg,color:'#fff',fontFamily:"'Outfit',sans-serif"}}>

      {/* Sidebar */}
      <aside style={{width:230,background:G.sidebar,borderRight:`1px solid ${G.border}`,position:'fixed',top:0,left:0,bottom:0,display:'flex',flexDirection:'column',padding:'24px 0'}}>
        <div style={{padding:'0 20px 22px',borderBottom:`1px solid ${G.border}`,marginBottom:14}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.15rem',color:G.green,fontWeight:600}}>🌿 Admin</div>
          <div style={{fontSize:'0.72rem',color:G.soft,marginTop:3}}>Ayyappa Tours</div>
        </div>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 20px',width:'100%',background:tab===t.id?'rgba(94,201,108,0.08)':'transparent',border:'none',borderLeft:`2px solid ${tab===t.id?G.green:'transparent'}`,color:tab===t.id?G.green:G.soft,fontSize:'0.85rem',cursor:'pointer',transition:'0.2s',fontFamily:"'Outfit',sans-serif",textAlign:'left'}}>
            <span>{t.icon}</span>{t.label}
            {t.id==='bookings'&&pendingCount>0&&<span style={{marginLeft:'auto',background:'rgba(212,168,67,0.18)',color:'#d4a843',fontSize:'0.65rem',padding:'2px 7px',borderRadius:10}}>{pendingCount}</span>}
          </button>
        ))}
        <div style={{marginTop:'auto',padding:'16px 20px',borderTop:`1px solid ${G.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:G.green,display:'inline-block'}}/>
            <span style={{fontSize:'0.78rem',color:G.soft}}>{adminUsername}</span>
          </div>
          <button onClick={logout} style={{width:'100%',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',color:'#f87171',padding:'9px',borderRadius:8,fontSize:'0.8rem',cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{marginLeft:230,flex:1,padding:32,minHeight:'100vh'}}>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <section>
            <PH title="Dashboard Overview" sub={new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} />
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(165px,1fr))',gap:16,marginBottom:28}}>
              {loading?<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:G.soft}}>Loading…</div>
              :stats?<>
                <SC icon="📋" val={stats.total}        label="Total Bookings" />
                <SC icon="⏳" val={stats.pending}      label="Pending"        color="#d4a843" />
                <SC icon="✅" val={stats.confirmed}    label="Confirmed"      color={G.green} />
                <SC icon="🗺️" val={stats.activeTrips}  label="Active Trips" />
                <SC icon="📍" val={stats.activePlaces} label="Places"         color={G.green} />
              </>:<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#f87171'}}>Failed to load stats.</div>}
            </div>
            <TC title="Recent Bookings" action={<GB onClick={()=>setTab('bookings')}>View All →</GB>}>
              <BT bookings={bookings.slice(0,5)} compact onUpdate={updateBookingStatus} />
            </TC>
          </section>
        )}

        {/* BOOKINGS */}
        {tab==='bookings'&&(
          <section>
            <PH title="Booking Inquiries" sub="Customer inquiries submitted via the website form" />
            <TC title={`All Bookings (${bookings.length})`} action={
              <div style={{display:'flex',gap:10}}>
                <input className="form-input" placeholder="Search name, email, ref…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:220,padding:'8px 14px',fontSize:'0.82rem'}}/>
                <select className="form-input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:140,padding:'8px 12px',fontSize:'0.82rem'}}>
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            }>
              <BT bookings={filteredBookings} onUpdate={updateBookingStatus} />
            </TC>
          </section>
        )}

        {/* PLACES */}
        {tab==='places'&&(
          <section>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
              <PH title="Manage Places" sub="Destinations shown in the homepage slider" noMargin />
              <GB onClick={()=>{setShowPlaceForm(p=>!p);setPlaceForm(EMPTY_PLACE);setEditingPlaceId(null);}}>
                {showPlaceForm?'Cancel':'+ Add New Place'}
              </GB>
            </div>
            {showPlaceForm&&(
              <FB title={editingPlaceId?'Edit Place':'Add New Place'}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14}}>
                  <FG label="Place Name *"><input className="form-input" placeholder="e.g. Munnar" value={placeForm.name} onChange={e=>setPlaceForm(p=>({...p,name:e.target.value}))}/></FG>
                  <FG label="Tag / Type"><input className="form-input" placeholder="e.g. Hill Station" value={placeForm.tag} onChange={e=>setPlaceForm(p=>({...p,tag:e.target.value}))}/></FG>
                  <FG label="Sort Order"><input className="form-input" type="number" placeholder="0" value={placeForm.sort_order} onChange={e=>setPlaceForm(p=>({...p,sort_order:e.target.value}))}/></FG>
                </div>
                <FG label="Image URL">
                  <div style={{display:'flex',gap:10}}>
                    <input className="form-input" style={{flex:1}} placeholder="https://..." value={placeForm.image_url} onChange={e=>setPlaceForm(p=>({...p,image_url:e.target.value}))}/>
                    <UB onUpload={e=>handleImageUpload(e,setPlaceForm)} busy={uploadingImage}/>
                  </div>
                </FG>
                <FG label="Description"><textarea className="form-input" rows={2} placeholder="Short description…" value={placeForm.description} onChange={e=>setPlaceForm(p=>({...p,description:e.target.value}))} style={{resize:'vertical'}}/></FG>
                <SB onClick={savePlace}>Save Place</SB>
              </FB>
            )}
            <TC title={`All Places (${places.length})`}>
              {loading?<ES text="Loading…"/>:places.length===0?<ES text="No places yet. Add destinations to show them on the website slider!"/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <TH cols={['Image','Name','Tag','Order','Status','Actions']}/>
                  <tbody>
                    {places.map(p=>(
                      <tr key={p.id} style={{borderBottom:`1px solid ${G.border}`}}>
                        <TD>{p.image_url?<img src={p.image_url} alt={p.name} style={{width:52,height:38,borderRadius:6,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>:<span style={{color:G.soft,fontSize:'0.75rem'}}>No img</span>}</TD>
                        <TD><span style={{fontWeight:500,fontSize:'0.88rem'}}>{p.name}</span>{p.description&&<div style={{fontSize:'0.71rem',color:G.soft,marginTop:2}}>{p.description.substring(0,55)}{p.description.length>55?'…':''}</div>}</TD>
                        <TD><span style={{fontSize:'0.78rem',color:'#52b788'}}>{p.tag||'—'}</span></TD>
                        <TD><span style={{fontSize:'0.82rem',color:G.soft}}>{p.sort_order}</span></TD>
                        <TD><span className={`badge badge-${p.active?'confirmed':'cancelled'}`}>{p.active?'Visible':'Hidden'}</span></TD>
                        <TD><div style={{display:'flex',gap:6}}><AB color={G.green} onClick={()=>editPlace(p)}>✏️ Edit</AB><AB color="rgba(255,255,255,0.5)" onClick={()=>togglePlace(p.id)}>{p.active?'🙈 Hide':'👁 Show'}</AB><AB color="#f87171" onClick={()=>deletePlace(p.id)}>🗑 Delete</AB></div></TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TC>
          </section>
        )}

        {/* TRIPS */}
        {tab==='trips'&&(
          <section>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
              <PH title="Manage Trips" sub="Packages displayed on the website — for information only" noMargin />
              <GB onClick={()=>{setShowTripForm(p=>!p);setTripForm(EMPTY_TRIP);setEditingTripId(null);}}>
                {showTripForm?'Cancel':'+ Add New Trip'}
              </GB>
            </div>
            {showTripForm&&(
              <FB title={editingTripId?'Edit Trip':'Add New Trip'}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14}}>
                  <FG label="Title *"><input className="form-input" placeholder="Trip title" value={tripForm.title} onChange={e=>setTripForm(p=>({...p,title:e.target.value}))}/></FG>
                  <FG label="Location"><input className="form-input" placeholder="e.g. Munnar, Kerala" value={tripForm.location} onChange={e=>setTripForm(p=>({...p,location:e.target.value}))}/></FG>
                  <FG label="Duration"><input className="form-input" placeholder="3 Days / 2 Nights" value={tripForm.duration} onChange={e=>setTripForm(p=>({...p,duration:e.target.value}))}/></FG>
                  <FG label="Max Capacity"><input className="form-input" type="number" placeholder="20" value={tripForm.max_capacity} onChange={e=>setTripForm(p=>({...p,max_capacity:e.target.value}))}/></FG>
                  <FG label="Category">
                    <select className="form-input" value={tripForm.category} onChange={e=>setTripForm(p=>({...p,category:e.target.value}))}>
                      {['wildlife','backwater','hillstation','beach','cultural'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </FG>
                </div>
                <FG label="Image URL">
                  <div style={{display:'flex',gap:10}}>
                    <input className="form-input" style={{flex:1}} placeholder="https://..." value={tripForm.image_url} onChange={e=>setTripForm(p=>({...p,image_url:e.target.value}))}/>
                    <UB onUpload={e=>handleImageUpload(e,setTripForm)} busy={uploadingImage}/>
                  </div>
                </FG>
                <FG label="Description"><textarea className="form-input" rows={3} placeholder="Trip description…" value={tripForm.description} onChange={e=>setTripForm(p=>({...p,description:e.target.value}))} style={{resize:'vertical'}}/></FG>
                <SB onClick={saveTrip}>Save Trip</SB>
              </FB>
            )}
            <TC title={`All Trips (${trips.length})`}>
              {loading?<ES text="Loading…"/>:trips.length===0?<ES text="No trips yet."/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <TH cols={['Image','Title','Location','Category','Duration','Capacity','Status','Actions']}/>
                  <tbody>
                    {trips.map(t=>(
                      <tr key={t.id} style={{borderBottom:`1px solid ${G.border}`}}>
                        <TD>{t.image_url?<img src={t.image_url} alt={t.title} style={{width:44,height:44,borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>:<span style={{color:G.soft,fontSize:'0.75rem'}}>No img</span>}</TD>
                        <TD><span style={{fontWeight:500,fontSize:'0.88rem'}}>{t.title}</span></TD>
                        <TD><span style={{color:G.soft,fontSize:'0.82rem'}}>{t.location}</span></TD>
                        <TD><span className={`badge badge-${t.category==='wildlife'?'confirmed':'pending'}`} style={{fontSize:'0.68rem'}}>{t.category}</span></TD>
                        <TD><span style={{fontSize:'0.82rem',color:G.soft}}>{t.duration||'—'}</span></TD>
                        <TD>{t.max_capacity||'—'}</TD>
                        <TD><span className={`badge badge-${t.available?'confirmed':'cancelled'}`}>{t.available?'Active':'Hidden'}</span></TD>
                        <TD><div style={{display:'flex',gap:6}}><AB color={G.green} onClick={()=>editTrip(t)}>✏️ Edit</AB><AB color="rgba(255,255,255,0.5)" onClick={()=>toggleTrip(t.id)}>{t.available?'🙈 Hide':'👁 Show'}</AB><AB color="#f87171" onClick={()=>deleteTrip(t.id)}>🗑 Delete</AB></div></TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TC>
          </section>
        )}

        {/* CABS */}
        {tab==='cabs'&&(
          <section>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
              <PH title="Manage Cabs" sub="Fleet displayed on the website — name, image, capacity, availability" noMargin />
              <GB onClick={()=>{setShowCabForm(p=>!p);setCabForm(EMPTY_CAB);setEditingCabId(null);}}>
                {showCabForm?'Cancel':'+ Add New Cab'}
              </GB>
            </div>
            {showCabForm&&(
              <FB title={editingCabId?'Edit Cab':'Add New Cab'}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14}}>
                  <FG label="Vehicle Name *"><input className="form-input" placeholder="e.g. Toyota Innova" value={cabForm.name} onChange={e=>setCabForm(p=>({...p,name:e.target.value}))}/></FG>
                  <FG label="Max Seats"><input className="form-input" type="number" placeholder="7" value={cabForm.max_capacity} onChange={e=>setCabForm(p=>({...p,max_capacity:e.target.value}))}/></FG>
                  <FG label="Category">
                    <select className="form-input" value={cabForm.category} onChange={e=>setCabForm(p=>({...p,category:e.target.value}))}>
                      {['Sedan','SUV','Hatchback','Traveller','Luxury'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </FG>
                </div>
                <FG label="Image URL">
                  <div style={{display:'flex',gap:10}}>
                    <input className="form-input" style={{flex:1}} placeholder="https://..." value={cabForm.image_url} onChange={e=>setCabForm(p=>({...p,image_url:e.target.value}))}/>
                    <UB onUpload={e=>handleImageUpload(e,setCabForm)} busy={uploadingImage}/>
                  </div>
                </FG>
                <FG label="Description"><textarea className="form-input" rows={2} placeholder="Vehicle features, AC, etc…" value={cabForm.description} onChange={e=>setCabForm(p=>({...p,description:e.target.value}))} style={{resize:'vertical'}}/></FG>
                <SB onClick={saveCab}>Save Cab</SB>
              </FB>
            )}
            <TC title={`All Cabs (${cabs.length})`}>
              {loading?<ES text="Loading…"/>:cabs.length===0?<ES text="No cabs yet. Add vehicles to display on the website!"/>:(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <TH cols={['Image','Vehicle Name','Category','Seats','Status','Actions']}/>
                  <tbody>
                    {cabs.map(c=>(
                      <tr key={c.id} style={{borderBottom:`1px solid ${G.border}`}}>
                        <TD>{c.image_url?<img src={c.image_url} alt={c.name} style={{width:52,height:40,borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>:<span style={{color:G.soft,fontSize:'0.75rem'}}>No img</span>}</TD>
                        <TD><span style={{fontWeight:500,fontSize:'0.88rem'}}>{c.name}</span>{c.description&&<div style={{fontSize:'0.71rem',color:G.soft,marginTop:2}}>{c.description.substring(0,55)}{c.description.length>55?'…':''}</div>}</TD>
                        <TD><span className="badge badge-pending" style={{fontSize:'0.68rem'}}>{c.category}</span></TD>
                        <TD>{c.max_capacity||'—'}</TD>
                        <TD><span className={`badge badge-${c.available?'confirmed':'cancelled'}`}>{c.available?'Visible':'Hidden'}</span></TD>
                        <TD><div style={{display:'flex',gap:6}}><AB color={G.green} onClick={()=>editCab(c)}>✏️ Edit</AB><AB color="rgba(255,255,255,0.5)" onClick={()=>toggleCab(c.id)}>{c.available?'🙈 Hide':'👁 Show'}</AB><AB color="#f87171" onClick={()=>deleteCab(c.id)}>🗑 Delete</AB></div></TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TC>
          </section>
        )}

        {/* LOGS */}
        {tab==='logs'&&(
          <section>
            <PH title="Security Logs" sub="Admin login history and IP tracking" />
            <TC title="Login Activity">
              {loading?<ES text="Loading…"/>:logs.length===0?<ES text="No login logs yet"/>:(
                logs.map(l=>(
                  <div key={l.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 22px',borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:'0.85rem'}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:l.success?'#5ec96c':'#f87171',flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500}}>{l.username||'Admin'}</div>
                      <div style={{fontSize:'0.72rem',color:G.soft}}>IP: {l.ip_address}</div>
                    </div>
                    <span style={{fontSize:'0.75rem',color:G.soft}}>{new Date(l.created_at).toLocaleString('en-IN')}</span>
                    <span className={`badge badge-${l.success?'confirmed':'cancelled'}`}>{l.success?'Success':'Failed'}</span>
                  </div>
                ))
              )}
            </TC>
          </section>
        )}
      </main>

      {toast&&(
        <div style={{position:'fixed',bottom:28,right:28,zIndex:9999,background:'#142114',border:`1px solid ${toast.type==='error'?'rgba(248,113,113,0.3)':'rgba(94,201,108,0.3)'}`,borderRadius:10,padding:'13px 18px',fontSize:'0.88rem',boxShadow:'0 10px 30px rgba(0,0,0,0.4)',animation:'slideIn 0.3s ease',minWidth:240}}>
          {toast.type==='error'?'❌ ':'✅ '}{toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ── Shared mini-components ────────────────────────────────────────────────
const G2={card:'#142114',border:'rgba(255,255,255,0.07)',green:'#5ec96c',soft:'rgba(255,255,255,0.45)'};
function PH({title,sub,noMargin}){return<div style={{marginBottom:noMargin?0:28}}><h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',fontWeight:600}}>{title}</h1>{sub&&<p style={{color:G2.soft,fontSize:'0.85rem',marginTop:4}}>{sub}</p>}</div>;}
function SC({icon,val,label,color}){return<div style={{background:G2.card,border:`1px solid ${G2.border}`,borderRadius:16,padding:20,transition:'0.3s',cursor:'default'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(94,201,108,0.2)';e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=G2.border;e.currentTarget.style.transform='';}}><div style={{fontSize:'1.4rem',marginBottom:8}}>{icon}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.9rem',lineHeight:1,marginBottom:4,color:color||'#fff'}}>{val}</div><div style={{fontSize:'0.7rem',color:G2.soft,letterSpacing:'0.8px',textTransform:'uppercase'}}>{label}</div></div>;}
function TC({title,action,children}){return<div style={{background:G2.card,border:`1px solid ${G2.border}`,borderRadius:16,overflow:'hidden'}}><div style={{padding:'18px 22px',borderBottom:`1px solid ${G2.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:600,fontSize:'0.95rem'}}>{title}</span>{action}</div>{children}</div>;}
function FB({title,children}){return<div style={{background:G2.card,border:`1px solid ${G2.border}`,borderRadius:16,padding:26,marginBottom:22}}><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',marginBottom:18}}>{title}</h3>{children}</div>;}
function FG({label,children}){return<div className="form-group" style={{margin:0}}><label className="form-label">{label}</label>{children}</div>;}
function SB({onClick,children}){return<button onClick={onClick} style={{background:'#5ec96c',color:'#060e06',border:'none',padding:'12px 20px',borderRadius:8,fontWeight:600,cursor:'pointer',fontFamily:"'Outfit',sans-serif",marginTop:10}}>{children}</button>;}
function UB({onUpload,busy}){return<label style={{background:'rgba(255,255,255,0.1)',color:'#fff',padding:'8px 16px',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',fontSize:'0.85rem',flexShrink:0}}>{busy?'Uploading...':'📁 Upload'}<input type="file" accept="image/*" style={{display:'none'}} onChange={onUpload} disabled={busy}/></label>;}
function BT({bookings,compact,onUpdate}){
  if(!bookings||bookings.length===0)return<ES text="No bookings yet 🌿"/>;
  return<table style={{width:'100%',borderCollapse:'collapse'}}><TH cols={['Ref','Customer','Phone','Destination','Date','Persons','Status',...(!compact?['Actions']:[])]}/>
  <tbody>{bookings.map(b=>(
    <tr key={b.id} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
      <TD><code style={{fontSize:'0.75rem',color:'#5ec96c'}}>{b.reference||`#${b.id}`}</code></TD>
      <TD><div style={{fontWeight:500,fontSize:'0.88rem'}}>{b.customer_name}</div><div style={{fontSize:'0.72rem',color:G2.soft}}>{b.customer_email}</div></TD>
      <TD><span style={{fontSize:'0.8rem',color:G2.soft}}>{b.customer_phone||'—'}</span></TD>
      <TD><span style={{fontSize:'0.83rem'}}>{b.place||'—'}</span></TD>
      <TD><span style={{fontSize:'0.8rem'}}>{b.travel_date?new Date(b.travel_date).toLocaleDateString('en-IN'):'—'}</span></TD>
      <TD>{b.persons}</TD>
      <TD><span className={`badge badge-${b.status}`}>{b.status}</span></TD>
      {!compact&&<TD><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {b.status==='pending'&&<><AB color="#5ec96c" onClick={()=>onUpdate(b.id,'confirmed')}>✓ Confirm</AB><AB color="#f87171" onClick={()=>onUpdate(b.id,'cancelled')}>✕ Cancel</AB></>}
        {b.status==='confirmed'&&<AB color="#f87171" onClick={()=>onUpdate(b.id,'cancelled')}>✕ Cancel</AB>}
        {b.status==='cancelled'&&<AB color="#5ec96c" onClick={()=>onUpdate(b.id,'confirmed')}>↺ Restore</AB>}
      </div></TD>}
    </tr>
  ))}</tbody></table>;
}
function TH({cols}){return<thead><tr>{cols.map(c=><th key={c} style={{padding:'11px 20px',textAlign:'left',fontSize:'0.68rem',letterSpacing:'1px',textTransform:'uppercase',color:G2.soft,background:'rgba(255,255,255,0.02)',borderBottom:`1px solid ${G2.border}`,fontWeight:500}}>{c}</th>)}</tr></thead>;}
function TD({children}){return<td style={{padding:'13px 20px',fontSize:'0.85rem',transition:'0.2s'}}>{children}</td>;}
function AB({children,color,onClick}){return<button onClick={onClick} style={{background:`${color}18`,border:`1px solid ${color}40`,color,padding:'5px 11px',borderRadius:6,fontSize:'0.72rem',fontWeight:500,cursor:'pointer',transition:'0.2s',fontFamily:"'Outfit',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background=`${color}30`} onMouseLeave={e=>e.currentTarget.style.background=`${color}18`}>{children}</button>;}
function GB({children,onClick}){return<button onClick={onClick} style={{background:'rgba(94,201,108,0.1)',border:'1px solid rgba(94,201,108,0.3)',color:'#5ec96c',padding:'9px 18px',borderRadius:8,fontSize:'0.82rem',cursor:'pointer',fontWeight:500,fontFamily:"'Outfit',sans-serif",transition:'0.2s'}}>{children}</button>;}
function ES({text}){return<div style={{textAlign:'center',padding:'50px',color:G2.soft,fontSize:'0.9rem'}}>{text}</div>;}