import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import s from "./Navbar.module.css";

const LINKS = [
  { href: "#trips",   label: "Experiences" },
  { href: "#about",   label: "About"       },
  { href: "#contact", label: "Contact"     },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <motion.nav
        className={`${s.nav} ${scrolled ? s.scrolled : ""}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className={s.inner}>
          <Link to="/" className={s.logo}>
            <span className={s.logoMark}>
              <svg viewBox="0 0 28 28" fill="none">
                <path d="M14 26C8 26 3 20.5 3 13.5c0-4.5 3-9 11-10.5 0 5.5-1 11 0 14.5C17 14 18 8.5 18 3c5.5 2 7 7 7 10.5C25 20.5 20 26 14 26z"
                  fill="currentColor"/>
              </svg>
            </span>
            <div className={s.logoText}>
              <span className={s.logoName}>Ayyappa</span>
              <span className={s.logoSub}>Tours &amp; Travels</span>
            </div>
          </Link>

          <ul className={s.links}>
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className={s.link}>{label}</a>
              </li>
            ))}
          </ul>

          <div className={s.right}>
            {/* ✅ Points to #booking section */}
            <a href="#booking" className={s.cta}>Book a Trip</a>
            <button
              className={`${s.burger} ${open ? s.burgerOpen : ""}`}
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={s.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className={s.drawer}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
            >
              <div className={s.drawerInner}>
                <div className={s.drawerLogo}>
                  <span>🌿</span>
                  <div>
                    <strong>Ayyappa Tours</strong>
                    <small>God&apos;s Own Country</small>
                  </div>
                </div>
                <nav className={s.drawerNav}>
                  {LINKS.map(({ href, label }, i) => (
                    <motion.a
                      key={href} href={href}
                      className={s.drawerLink}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 + 0.1 }}
                      onClick={() => setOpen(false)}
                    >
                      <span className={s.drawerNum}>0{i+1}</span>
                      {label}
                      <span className={s.drawerArrow}>→</span>
                    </motion.a>
                  ))}
                </nav>

                {/* Book a Trip button in mobile drawer too */}
                <motion.a
                  href="#booking"
                  className={s.drawerCta}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={() => setOpen(false)}
                >
                  Book a Trip ✓
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}