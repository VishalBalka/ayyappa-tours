import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import s from "./Hero.module.css";

const SLIDES = [
  { img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=85", tag: "Wildlife Safaris",  h: "Into the Wild",    p: "Kerala's ancient forests, untouched and alive"  },
  { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85", tag: "Hill Stations",    h: "Misty Highlands",  p: "Where tea gardens dissolve into the clouds"      },
  { img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=85",    tag: "Backwaters",       h: "Still Waters",     p: "Drift through emerald waterways at golden hour" },
  { img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85", tag: "Beach Retreats",   h: "Coastal Light",    p: "Luminous shores of God's own country"           },
];

export default function Hero({ onExplore }) {
  const [cur, setCur]   = useState(0);
  const [prev, setPrev] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPrev(cur);
      setCur(c => (c + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(t);
  }, [cur]);

  const go = (i) => { if (i === cur) return; setPrev(cur); setCur(i); };
  const s0 = SLIDES[cur];

  return (
    <section className={s.hero}>
      {/* Background images */}
      <AnimatePresence>
        <motion.div
          key={cur}
          className={s.bg}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1,  scale: 1    }}
          exit={{    opacity: 0              }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <img src={s0.img} alt={s0.h} fetchpriority="high" />
          <div className={s.overlay} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className={s.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={cur}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className={s.tag}>{s0.tag}</span>
            <h1 className={s.heading}>{s0.h}</h1>
            <p className={s.sub}>{s0.p}</p>
          </motion.div>
        </AnimatePresence>

        <motion.div
          className={s.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button className={s.btnPrimary} onClick={onExplore}>
            Explore Experiences
          </button>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WA || "919999999999"}`}
            target="_blank" rel="noopener noreferrer"
            className={s.btnGhost}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Us
          </a>
        </motion.div>
      </div>

      {/* Dots */}
      <div className={s.dots}>
        {SLIDES.map((_, i) => (
          <button key={i} className={`${s.dot} ${i === cur ? s.dotOn : ""}`} onClick={() => go(i)} aria-label={`Slide ${i+1}`} />
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className={s.scroll}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </motion.div>
    </section>
  );
}
