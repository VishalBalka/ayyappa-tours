import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import s from "./AdminLogin.module.css";

export default function AdminLogin() {
  const [form,    setForm]    = useState({ username: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);

  const { login, user } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/admin/dashboard";

  // Already logged in — redirect
  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      {/* Background glow */}
      <div className={s.glow} />

      <motion.div
        className={s.card}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Logo */}
        <div className={s.logo}>
          <span className={s.logoMark}>
            <svg viewBox="0 0 28 28" fill="none">
              <path d="M14 26C8 26 3 20.5 3 13.5c0-4.5 3-9 11-10.5 0 5.5-1 11 0 14.5C17 14 18 8.5 18 3c5.5 2 7 7 7 10.5C25 20.5 20 26 14 26z" fill="currentColor"/>
            </svg>
          </span>
          <div>
            <h1 className={s.logoName}>Ayyappa Tours</h1>
            <p className={s.logoSub}>Admin Portal</p>
          </div>
        </div>

        {/* Security note */}
        <div className={s.secNote}>
          <span>🔒</span>
          <span>Secured with HttpOnly cookies — token never exposed to JavaScript</span>
        </div>

        {/* Form */}
        <form onSubmit={submit} className={s.form} autoComplete="off">
          <label className={s.field}>
            <span>Username</span>
            <input
              type="text"
              value={form.username}
              onChange={e => set("username", e.target.value)}
              autoComplete="username"
              required
              autoFocus
              spellCheck={false}
            />
          </label>

          <label className={s.field}>
            <span>Password</span>
            <div className={s.passWrap}>
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className={s.eye} onClick={() => setShow(v => !v)} tabIndex={-1}>
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {error && (
            <motion.div className={s.error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ⚠ {error}
            </motion.div>
          )}

          <button type="submit" className={s.btn} disabled={loading}>
            {loading
              ? <span className={s.spinner} />
              : "Sign In →"}
          </button>
        </form>

        <p className={s.back}>
          <a href="/">← Back to site</a>
        </p>
      </motion.div>
    </div>
  );
}
