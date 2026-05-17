import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import s from "./Hero.module.css";

const SLIDES = [
  { img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=85", tag: "Hill Stations",   h: "Misty Highlands",  p: "Where tea gardens dissolve into the clouds"      },
  { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85", tag: "Wildlife",        h: "Into the Wild",    p: "Kerala's ancient forests, untouched and alive"  },
  { img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=85",    tag: "Backwaters",      h: "Still Waters",     p: "Drift through emerald waterways at golden hour" },
  { img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85", tag: "Beach Retreats",  h: "Coastal Light",    p: "Luminous shores of God's own country"           },
];

export default function Hero({ onExplore }) {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[cur];

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className={s.hero}>
      {/* Background slider */}
      <AnimatePresence>
        <motion.div
          key={cur}
          className={s.bg}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1,  scale: 1    }}
          exit={{    opacity: 0              }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <img src={slide.img} alt={slide.h} fetchpriority="high" />
          <div className={s.overlay} />
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div className={s.dots}>
        {SLIDES.map((_, i) => (
          <button key={i} className={`${s.dot} ${i === cur ? s.dotOn : ""}`}
            onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      {/* Main content — centred */}
      <div className={s.content}>
        <AnimatePresence mode="wait">
          <motion.div key={cur} className={s.textBlock}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -18 }}
            transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className={s.tag}>{slide.tag}</span>
            <h1 className={s.heading}>{slide.h}</h1>
            <p className={s.sub}>{slide.p}</p>
          </motion.div>
        </AnimatePresence>

        {/* CTAs */}
        <motion.div className={s.ctas}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          <button className={s.ctaPrimary} onClick={scrollToBooking}>
            Book Your Tour
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button className={s.ctaSecondary} onClick={onExplore}>
            Explore Packages
          </button>
        </motion.div>

        {/* Badges */}
        <motion.div className={s.badges}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          {[["500+","Happy Travellers"],["10+","Years Experience"],["4.9★","Guest Rating"]].map(([n, l]) => (
            <div key={l} className={s.badge}>
              <strong>{n}</strong><span>{l}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}