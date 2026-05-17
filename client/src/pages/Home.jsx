import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import Hero    from "../components/Hero";
import TripCard from "../components/TripCard";
import s from "./Home.module.css";

const CATS = ["All", "wildlife", "hillstation", "backwater", "beach"];

const SAMPLE_TRIPS = [
  { id:1, title:"Munnar Hill Escape",       description:"3 days through mist-covered tea plantations and rolling highlands.",  location:"Munnar, Kerala",  category:"hillstation", max_capacity:25, image_url:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80", duration:"3 Days", available:true },
  { id:2, title:"Periyar Wildlife Safari",  description:"Cruise Periyar Lake and watch wild elephants emerge at dawn.",        location:"Thekkady, Kerala", category:"wildlife",    max_capacity:20, image_url:"https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80", duration:"2 Days", available:true },
  { id:3, title:"Alleppey Houseboat Drift", description:"Drift through emerald backwaters on a traditional Kerala houseboat.", location:"Alleppey, Kerala", category:"backwater",   max_capacity:15, image_url:"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80", duration:"2 Days", available:true },
  { id:4, title:"Kovalam Beach Retreat",    description:"Luminous crescent beach with lighthouse views and sea-salt air.",    location:"Kovalam, Kerala",  category:"beach",       max_capacity:30, image_url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", duration:"2 Days", available:true },
];

// ── Sanitise ──────────────────────────────────────────────────────────────
const clean = (v) => typeof v === "string" ? v.replace(/[<>"'%;()&+\\]/g, "").trim() : v;

const INIT = {
  customer_name: "", customer_email: "", customer_phone: "",
  place: "", travel_date: "", persons: 1, special_requests: "",
};

// ── WhatsApp float ────────────────────────────────────────────────────────
const WhatsAppBtn = () => (
  <motion.a
    href={`https://wa.me/${import.meta.env.VITE_WA || "919573680120"}`}
    target="_blank" rel="noopener noreferrer"
    className={s.wa}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 2.5, type: "spring", damping: 15 }}
    whileHover={{ scale: 1.1 }}
    aria-label="WhatsApp"
  >
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    <span className={s.waPulse} />
  </motion.a>
);

// ── Places Slider ─────────────────────────────────────────────────────────
function PlacesSlider({ places }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  const startTimer = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => (i + 1) % places.length), 3500);
  };

  useEffect(() => {
    if (places.length > 1) startTimer();
    return () => clearInterval(timer.current);
  }, [places.length]);

  if (!places.length) return null;

  const visible = [];
  for (let i = 0; i < Math.min(4, places.length); i++) {
    visible.push(places[(idx + i) % places.length]);
  }

  return (
    <div className={s.placesWrap}>
      <div className={s.placesTrack}>
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.div
              key={`${p.id}-${i}`}
              className={`${s.placeCard} ${i === 0 ? s.placeCardFeatured : ""}`}
              initial={{ opacity: 0, x: 50, scale: 0.96 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: -50, scale: 0.96 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.23,1,0.32,1] }}
              layout
            >
              {p.image_url && (
                <div className={s.placeImg}>
                  <img src={p.image_url} alt={p.name} loading="lazy" />
                  <div className={s.placeImgOverlay} />
                </div>
              )}
              <div className={s.placeGlass}>
                {p.tag && <span className={s.placeTag}>{p.tag}</span>}
                <h3 className={s.placeName}>{p.name}</h3>
                {p.description && <p className={s.placeDesc}>{p.description}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {places.length > 1 && (
        <div className={s.placeDots}>
          {places.map((_, i) => (
            <button key={i}
              className={`${s.placeDot} ${i === idx ? s.placeDotOn : ""}`}
              onClick={() => { setIdx(i); startTimer(); }}
              aria-label={`Place ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cab Card ──────────────────────────────────────────────────────────────
function CabCard({ cab, index }) {
  const FALLBACK = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80";
  return (
    <motion.div className={s.cabCard}
      initial={{ opacity:0, y:24 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:"-60px" }}
      transition={{ duration:0.5, delay:index*0.07, ease:[0.23,1,0.32,1] }}
    >
      <div className={s.cabImgWrap}>
        <img src={cab.image_url || FALLBACK} alt={cab.name} loading="lazy"
          onError={(e) => { e.target.src = FALLBACK; }} />
        <div className={s.cabOverlay} />
        {cab.category && <span className={s.cabCat}>{cab.category}</span>}
      </div>
      <div className={s.cabBody}>
        <h3 className={s.cabName}>{cab.name}</h3>
        {cab.description && <p className={s.cabDesc}>{cab.description}</p>}
        <div className={s.cabMeta}>
          {cab.max_capacity && <span>👥 Up to {cab.max_capacity} seats</span>}
          <span className={s.cabAvail}>{cab.available ? "✅ Available" : "Currently Unavailable"}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────
function BookingForm() {
  const [form, setForm] = useState(INIT);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [err,  setErr]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isValid =
    form.customer_name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email) &&
    form.customer_phone.trim().length >= 6 &&
    form.travel_date !== "" &&
    Number(form.persons) >= 1;

  const submit = async () => {
    if (!isValid) return;
    setBusy(true); setErr("");
    try {
      const data = await api.createBooking({
        customer_name:    clean(form.customer_name),
        customer_email:   clean(form.customer_email),
        customer_phone:   clean(form.customer_phone),
        place:            clean(form.place),
        travel_date:      form.travel_date,
        persons:          Number(form.persons),
        special_requests: clean(form.special_requests) || null,
      });
      setDone(data.booking?.reference || data.reference || "AYT-SUCCESS");
      setForm(INIT);
    } catch (e) {
      setErr(e.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={s.bookingSuccess}>
        <motion.div className={s.successIcon}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 14 }}
        >✓</motion.div>
        <h3>Booking Received!</h3>
        <p>We'll contact you within 24 hours to confirm your journey.</p>
        <div className={s.refBox}>
          <span>Reference Number</span>
          <strong>{done}</strong>
        </div>
        <p className={s.emailNote}>📧 Confirmation sent to your email &amp; WhatsApp</p>
        <button className={s.resetBtn} onClick={() => setDone(null)}>
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <div className={s.bookingCard}>
      <div className={s.bookingCardHead}>
        <span className={s.bookingLeaf}>🌿</span>
        <div>
          <h3 className={s.bookingCardTitle}>Book Your Tour</h3>
          <p className={s.bookingCardSub}>Free inquiry · No payment required</p>
        </div>
      </div>

      <div className={s.bookingFields}>
        {/* Row: Name + Phone */}
        <div className={s.bookingRow}>
          <div className={s.bookingField}>
            <label>Full Name *</label>
            <input type="text" placeholder="Your full name"
              value={form.customer_name} maxLength={100}
              onChange={(e) => set("customer_name", e.target.value)} />
          </div>
          <div className={s.bookingField}>
            <label>Phone (any country) *</label>
            <input type="tel" placeholder="+91 / +1 / +44..."
              value={form.customer_phone} maxLength={25}
              onChange={(e) => set("customer_phone", e.target.value.replace(/[^0-9+\-\s]/g, ""))} />
          </div>
        </div>

        {/* Email */}
        <div className={s.bookingField}>
          <label>Email Address *</label>
          <input type="email" placeholder="your@email.com"
            value={form.customer_email} maxLength={150}
            onChange={(e) => set("customer_email", e.target.value)} />
        </div>

        {/* Row: Destination + Persons */}
        <div className={s.bookingRow}>
          <div className={s.bookingField}>
            <label>Destination / Place</label>
            <input type="text" placeholder="e.g. Munnar, Alleppey…"
              value={form.place} maxLength={255}
              onChange={(e) => set("place", e.target.value)} />
          </div>
          <div className={s.bookingField}>
            <label>No. of Persons *</label>
            <input type="number" min={1} max={50}
              value={form.persons}
              onChange={(e) => set("persons", e.target.value)} />
          </div>
        </div>

        {/* Travel date */}
        <div className={s.bookingField}>
          <label>Travel Date *</label>
          <input type="date"
            min={new Date().toISOString().split("T")[0]}
            value={form.travel_date}
            onChange={(e) => set("travel_date", e.target.value)} />
        </div>

        {/* Special requests */}
        <div className={s.bookingField}>
          <label>Special Requests (optional)</label>
          <textarea rows={2} placeholder="Dietary needs, preferences, group type…"
            value={form.special_requests} maxLength={500}
            onChange={(e) => set("special_requests", e.target.value)} />
        </div>
      </div>

      {err && <div className={s.bookingErr}>⚠ {err}</div>}

      <button className={s.bookingSubmit}
        disabled={!isValid || busy}
        onClick={submit}
      >
        {busy
          ? <><span className={s.spinner} /> Sending…</>
          : "Send Booking Request ✓"}
      </button>

      <p className={s.bookingPrivacy}>
        🔒 Your details are encrypted and never shared with third parties.
      </p>
    </div>
  );
}

// ── Main Home ─────────────────────────────────────────────────────────────
export default function Home() {
  const [cat, setCat] = useState("All");
  const tripsRef = useRef(null);

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"], queryFn: api.getTrips,
    placeholderData: SAMPLE_TRIPS, staleTime: 1000*60*5,
  });

  const { data: cabs = [] } = useQuery({
    queryKey: ["cabs"], queryFn: api.getCabs,
    staleTime: 1000*60*5,
  });

  const { data: places = [] } = useQuery({
    queryKey: ["places"], queryFn: api.getPlaces,
    staleTime: 1000*60*10,
  });

  const list = cat === "All" ? trips : trips.filter((t) => t.category === cat);
  const visibleCabs = cabs.filter((c) => c.available !== false);

  return (
    <div className={s.page}>
      <Hero onExplore={() => tripsRef.current?.scrollIntoView({ behavior:"smooth" })} />

      {/* ── Places ── */}
      {places.length > 0 && (
        <section className={s.placesSection} id="places">
          <div className="container">
            <motion.div className={s.secHead}
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ duration:0.6 }}
            >
              <span className={s.secTag}>DESTINATIONS</span>
              <h2 className={s.secH}>Places We Take You</h2>
              <p className={s.secP}>Handpicked destinations across God's Own Country</p>
            </motion.div>
            <PlacesSlider places={places} />
          </div>
        </section>
      )}

      {/* ── Trips ── */}
      <section className={s.tripsSection} id="trips" ref={tripsRef}>
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.6 }}
          >
            <span className={s.secTag}>OUR PACKAGES</span>
            <h2 className={s.secH}>Kerala Experiences</h2>
            <p className={s.secP}>Handcrafted journeys through God's Own Country</p>
          </motion.div>

          <div className={s.filters}>
            {CATS.map((c) => (
              <button key={c}
                className={`${s.filter} ${cat===c ? s.filterOn : ""}`}
                onClick={() => setCat(c)}
              >
                {c === "All" ? "All Packages" : c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className={s.empty}>No packages in this category.</p>
          ) : (
            <div className={s.grid}>
              {list.map((t, i) => <TripCard key={t.id} trip={t} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Cabs ── */}
      {visibleCabs.length > 0 && (
        <section className={s.cabsSection} id="cabs">
          <div className="container">
            <motion.div className={s.secHead}
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ duration:0.6 }}
            >
              <span className={s.secTag}>OUR FLEET</span>
              <h2 className={s.secH}>Travel in Comfort</h2>
              <p className={s.secP}>Our well-maintained vehicles for your Kerala journey</p>
            </motion.div>
            <div className={s.cabsGrid}>
              {visibleCabs.map((c, i) => <CabCard key={c.id} cab={c} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Booking Form ── */}
      <section className={s.bookingSection} id="booking">
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.6 }}
          >
            <span className={s.secTag}>BOOK NOW</span>
            <h2 className={s.secH}>Plan Your Kerala Journey</h2>
            <p className={s.secP}>Fill in your details and we'll craft the perfect itinerary for you</p>
          </motion.div>

          <motion.div
            initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.65, ease:[0.23,1,0.32,1] }}
            className={s.bookingWrap}
          >
            <BookingForm />
          </motion.div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className={s.whySection} id="about">
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.6 }}
          >
            <span className={s.secTag}>WHY AYYAPPA TOURS</span>
            <h2 className={s.secH}>More Than a Tour</h2>
          </motion.div>
          <div className={s.whyGrid}>
            {[
              ["🌿","Authentic Kerala",  "Deep connections with local communities, forests, and backwaters."],
              ["🛡️","Safe & Trusted",    "10+ years of certified guides and responsible tourism."],
              ["🎒","Curated Only",      "Every itinerary is handcrafted — never generic packages."],
              ["📞","Always There",      "24/7 support from first inquiry to safe return home."],
            ].map(([icon,title,desc], i) => (
              <motion.div key={title} className={s.whyCard}
                initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.08, duration:0.5 }}
              >
                <span className={s.whyIcon}>{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className={s.contactSection} id="contact">
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.6 }}
          >
            <span className={s.secTag}>GET IN TOUCH</span>
            <h2 className={s.secH}>Plan Your Journey</h2>
            <p className={s.secP}>Fill the booking form above or reach us directly</p>
          </motion.div>
          <div className={s.contactGrid}>
            {[
              ["📞","Phone",    "+91 9573680120",        "tel:+919573680120",                               false],
              ["✉️","Email",    "ayyappatours@gmail.com","mailto:ayyappatours@gmail.com",                    false],
              ["📍","Location", "Aluva, Kerala, India",  "https://maps.google.com/?q=Aluva,+Kerala,+India", true ],
              ["💬","WhatsApp", "Chat with us",          "https://wa.me/919573680120",                       true ],
            ].map(([icon,label,val,href,external]) => (
              <motion.a key={label} href={href}
                target={external?"_blank":undefined}
                rel={external?"noopener noreferrer":undefined}
                className={s.contactCard}
                whileHover={{ y:-4 }} transition={{ duration:0.2 }}
              >
                <span className={s.contactIcon}>{icon}</span>
                <strong>{label}</strong>
                <span>{val}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={`container ${s.footerInner}`}>
          <div>
            <span className={s.footerBrand}>🌿 Ayyappa <em>Tours</em></span>
            <p>God's Own Country, curated for you.</p>
          </div>
          <p>© {new Date().getFullYear()} Ayyappa Tours. All rights reserved.</p>
        </div>
      </footer>

      <WhatsAppBtn />
    </div>
  );
}