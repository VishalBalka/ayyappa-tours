import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../api/client";
import Navbar       from "../components/Navbar";
import Hero         from "../components/Hero";
import TripCard     from "../components/TripCard";
import BookingModal from "../components/BookingModal";
import s from "./Home.module.css";

const CATS = ["All", "wildlife", "hillstation", "backwater", "beach"];

const SAMPLE = [
  { id:1, title:"Munnar Hill Escape",       description:"3 days through mist-covered tea plantations and rolling highlands.", location:"Munnar, Kerala",   category:"hillstation", price:8500, max_capacity:25, image_url:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",   duration:"3 Days", available:true },
  { id:2, title:"Periyar Wildlife Safari",  description:"Cruise Periyar Lake and watch wild elephants emerge at dawn.",      location:"Thekkady, Kerala",  category:"wildlife",    price:5500, max_capacity:20, image_url:"https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80",   duration:"2 Days", available:true },
  { id:3, title:"Alleppey Houseboat Drift", description:"Drift through emerald backwaters on a traditional Kerala houseboat.",location:"Alleppey, Kerala",  category:"backwater",   price:7200, max_capacity:15, image_url:"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80",   duration:"2 Days", available:true },
  { id:4, title:"Kovalam Beach Retreat",    description:"Luminous crescent beach with lighthouse views and sea-salt air.",   location:"Kovalam, Kerala",   category:"beach",       price:3500, max_capacity:30, image_url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",   duration:"2 Days", available:true },
  { id:5, title:"Wayanad Forest Trail",     description:"Trek ancient rainforests and discover tribal cultural heritage.",    location:"Wayanad, Kerala",   category:"wildlife",    price:4800, max_capacity:12, image_url:"https://images.unsplash.com/photo-1542401886-65d6c61db217?w=600&q=80",   duration:"3 Days", available:true },
  { id:6, title:"Varkala Cliff Experience", description:"Red laterite cliffs, mineral springs, and pristine sea shores.",    location:"Varkala, Kerala",   category:"beach",       price:2800, max_capacity:20, image_url:"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&q=80",   duration:"2 Days", available:true },
];

const WhatsAppBtn = () => (
  <motion.a
    href={`https://wa.me/${import.meta.env.VITE_WA || "919573680120"}`}
    target="_blank" rel="noopener noreferrer"
    className={s.wa}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 2.5, type: "spring", damping: 15 }}
    whileHover={{ scale: 1.12 }}
    aria-label="WhatsApp"
  >
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    <span className={s.waPulse} />
  </motion.a>
);

export default function Home() {
  const [cat,      setCat]      = useState("All");
  const [selected, setSelected] = useState(null);
  const tripsRef = useRef(null);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn:  api.getTrips,
    placeholderData: SAMPLE,
    staleTime: 1000 * 60 * 5,
  });

  const list = cat === "All" ? trips : trips.filter(t => t.category === cat);

  return (
    <div className={s.page}>
      <Navbar />
      <Hero onExplore={() => tripsRef.current?.scrollIntoView({ behavior: "smooth" })} />

      {/* Stats */}
      <section className={s.stats}>
        <div className="container">
          <div className={s.statsGrid}>
            {[["500+","Happy Travellers"],["15+","Curated Trips"],["10+","Years Experience"],["4.9★","Average Rating"]].map(([n,l], i) => (
              <motion.div key={l} className={s.statItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <strong>{n}</strong>
                <span>{l}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trips */}
      <section className={s.trips} id="trips" ref={tripsRef}>
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={s.secTag}>OUR EXPERIENCES</span>
            <h2 className={s.secH}>Handpicked Kerala Adventures</h2>
            <p className={s.secP}>Every journey crafted for authentic, unforgettable memories</p>
          </motion.div>

          <div className={s.filters}>
            {CATS.map(c => (
              <button key={c}
                className={`${s.filter} ${cat === c ? s.filterOn : ""}`}
                onClick={() => setCat(c)}
              >
                {c === "All" ? "All Trips" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className={s.grid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={s.skeleton} />)}
            </div>
          ) : list.length === 0 ? (
            <p className={s.empty}>No trips in this category.</p>
          ) : (
            <div className={s.grid}>
              {list.map((t, i) => (
                <TripCard key={t.id} trip={t} onBook={setSelected} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <section className={s.why} id="about">
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <span className={s.secTag}>WHY AYYAPPA TOURS</span>
            <h2 className={s.secH}>More Than a Tour</h2>
          </motion.div>
          <div className={s.whyGrid}>
            {[["🌿","Authentic Kerala","Deep connections with tribal communities and forest experts."],
              ["🛡️","Safe & Trusted","10+ years, certified guides, responsible tourism."],
              ["🎒","Curated Only","Every itinerary handcrafted — never generic."],
              ["📞","Always There","24/7 support from booking to safe return."],
            ].map(([icon, title, desc], i) => (
              <motion.div key={title} className={s.whyCard}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className={s.contact} id="contact">
        <div className="container">
          <motion.div className={s.secHead}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <span className={s.secTag}>GET IN TOUCH</span>
            <h2 className={s.secH}>Plan Your Journey</h2>
          </motion.div>
          <div className={s.contactGrid}>
            {[
              ["📞", "Phone", "+91 9573680120", "tel:+919573680120"],
              ["✉️", "Email", "vishalbalka@gmail.com", "mailto:vishalbalka@gmail.com"],
              ["📍", "Location", "Aluva, Kerala, India", "https://maps.google.com/?q=Aluva,+Kerala,+India"]
            ].map(([icon, label, val, link]) => (
              <a 
                key={label} 
                href={link} 
                target={label === "Location" ? "_blank" : undefined} 
                rel={label === "Location" ? "noopener noreferrer" : undefined} 
                className={s.contactCard}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <span>{icon}</span>
                <strong>{label}</strong>
                <span>{val}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={`container ${s.footerInner}`}>
          <div>
            <span className={s.footerBrand}>🌿 Ayyappa <em>Tours</em></span>
            <p>God&apos;s Own Country, curated for you.</p>
          </div>
          <p>&copy; {new Date().getFullYear()} Ayyappa Tours. All rights reserved.</p>
        </div>
      </footer>

      {selected && <BookingModal trip={selected} onClose={() => setSelected(null)} />}
      <WhatsAppBtn />
    </div>
  );
}
