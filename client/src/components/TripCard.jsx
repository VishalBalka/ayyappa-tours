import { motion } from "framer-motion";
import s from "./TripCard.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const ICONS = { wildlife: "🐘", hillstation: "🏔️", backwater: "🚣", beach: "🏖️" };

const FALLBACK = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80";

export default function TripCard({ trip, onBook, index = 0 }) {
  return (
    <motion.article
      className={s.card}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className={s.imgWrap}>
        <img
          src={trip.image_url || FALLBACK}
          alt={trip.title}
          loading="lazy"
          onError={e => { e.target.src = FALLBACK; }}
        />
        <span className={s.badge}>{ICONS[trip.category] || "🌿"} {trip.category}</span>
        {trip.duration && <span className={s.dur}>{trip.duration}</span>}
        <div className={s.imgOverlay} />
      </div>

      <div className={s.body}>
        <p className={s.loc}>📍 {trip.location}</p>
        <h3 className={s.title}>{trip.title}</h3>
        <p className={s.desc}>{trip.description}</p>

        <div className={s.foot}>
          <div className={s.price}>
            <span className={s.priceFrom}>from</span>
            <span className={s.priceVal}>{fmt(trip.price)}</span>
            <span className={s.pricePer}>/person</span>
          </div>
          <button className={s.btn} onClick={() => onBook?.(trip)}>
            Book Now
          </button>
        </div>
      </div>
    </motion.article>
  );
}
