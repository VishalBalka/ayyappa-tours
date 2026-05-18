import { useState, useEffect } from "react";
import s from "./SplashScreen.module.css";

export default function SplashScreen({ onReady }) {
  const [phase, setPhase] = useState("enter"); // enter → loading → exit
  const [dots, setDots]   = useState(0);
  const [tip,  setTip]    = useState(0);

  const tips = [
    "Preparing your Kerala experience…",
    "Loading misty hill stations…",
    "Setting sail on backwaters…",
    "Waking the wildlife…",
    "Almost there…",
  ];

  useEffect(() => {
    // Animate dots
    const dotTimer = setInterval(() => setDots((d) => (d + 1) % 4), 500);

    // Rotate tips
    const tipTimer = setInterval(() => setTip((t) => (t + 1) % tips.length), 2200);

    // Ping server then exit
    const ping = async () => {
      try {
        await fetch("/api/health", { signal: AbortSignal.timeout(60000) });
      } catch (_) {
        // server might not have /health — that's fine
      } finally {
        setPhase("exit");
        setTimeout(() => onReady?.(), 700);
      }
    };

    // Small delay so animation plays first
    const pingTimer = setTimeout(ping, 800);

    return () => {
      clearInterval(dotTimer);
      clearInterval(tipTimer);
      clearTimeout(pingTimer);
    };
  }, []);

  if (phase === "exit") {
    return <div className={`${s.splash} ${s.exit}`} />;
  }

  return (
    <div className={`${s.splash} ${s.enter}`}>
      {/* Background */}
      <div className={s.bg} />
      <div className={s.overlay} />

      {/* Floating leaves */}
      {[...Array(6)].map((_, i) => (
        <span key={i} className={s.leaf} style={{ "--i": i }}>🌿</span>
      ))}

      {/* Content */}
      <div className={s.content}>
        {/* Logo */}
        <div className={s.logoWrap}>
          <div className={s.logoRing}>
            <svg viewBox="0 0 48 48" fill="none" className={s.logoSvg}>
              <path
                d="M24 44C14 44 6 35.5 6 25c0-7.5 5-15 18-17.5 0 9-1.5 18 0 24C27 22.5 29 14 29 6c9 3.5 13 12 13 19C42 35.5 34 44 24 44z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1 className={s.brand}>
          Ayyappa <em>Tours</em>
        </h1>
        <p className={s.tagline}>God's Own Country</p>

        {/* Loading bar */}
        <div className={s.barWrap}>
          <div className={s.bar} />
        </div>

        {/* Tip text */}
        <p className={s.tip} key={tip}>
          {tips[tip]}
          <span className={s.dots}>{"•".repeat(dots)}</span>
        </p>
      </div>
    </div>
  );
}