import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import s from "./BookingModal.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const CABS = [
  { value: "none",  label: "No Cab",  price: 0,    icon: "🚶", desc: "Self arranged" },
  { value: "sedan", label: "Sedan",   price: 1500, icon: "🚗", desc: "Up to 4 people" },
  { value: "suv",   label: "SUV",     price: 2500, icon: "🚙", desc: "Up to 7 people" },
  { value: "tempo", label: "Tempo",   price: 3500, icon: "🚌", desc: "Up to 12 people" },
];

const GROUPS  = ["solo", "couple", "family", "friends", "corporate"];
const STEPS   = ["Details", "Trip Info", "Confirm"];

const INIT = {
  customer_name: "", customer_email: "", customer_phone: "",
  nationality: "Indian", travel_date: "", persons: 1,
  group_type: "family", cab_type: "none", special_requests: "",
};

export default function BookingModal({ trip, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT);
  const [done, setDone] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cab      = CABS.find(c => c.value === form.cab_type) || CABS[0];
  const tripCost = (trip?.price || 0) * Number(form.persons);
  const total    = tripCost + cab.price;

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const canNext = () => {
    if (step === 0) {
      return form.customer_name.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email) &&
        form.customer_phone.trim().length >= 7;
    }
    if (step === 1) return form.travel_date !== "";
    return true;
  };

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.createBooking({
      trip_id:          trip.id,
      customer_name:    form.customer_name.trim(),
      customer_email:   form.customer_email.trim(),
      customer_phone:   form.customer_phone.trim(),
      nationality:      form.nationality.trim() || "Indian",
      travel_date:      form.travel_date,
      persons:          Number(form.persons),
      group_type:       form.group_type,
      cab_type:         form.cab_type,
      special_requests: form.special_requests.trim() || null,
    }),
    onSuccess: (data) => setDone(data),
  });

  // Success screen
  if (done) {
    const ref = done.booking?.reference || done.reference || "—";
    return (
      <div className={s.overlay} onClick={onClose}>
        <motion.div className={s.modal} onClick={e => e.stopPropagation()}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 22 }}
        >
          <div className={s.success}>
            <motion.div className={s.successIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.1 }}
            >✓</motion.div>
            <h2>Booking Confirmed!</h2>
            <p>We will reach out within 24 hours to finalise your Kerala adventure.</p>
            <div className={s.refBox}>
              <span>Your Reference</span>
              <strong>{ref}</strong>
            </div>
            <button className={s.btnPri} onClick={onClose}>Close</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <motion.div
        className={s.modal}
        onClick={e => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{    y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
      >
        {/* Header */}
        <div className={s.head}>
          <div>
            <p className={s.headTag}>BOOKING REQUEST</p>
            <h2 className={s.headTitle}>{trip?.title}</h2>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Progress */}
        <div className={s.progress}>
          {STEPS.map((label, i) => (
            <div key={label} className={`${s.step} ${i === step ? s.stepActive : ""} ${i < step ? s.stepDone : ""}`}>
              <div className={s.stepBar} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className={s.body}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{    opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              {/* Step 0 */}
              {step === 0 && (
                <div className={s.fields}>
                  <label className={s.field}>
                    Full Name *
                    <input type="text" value={form.customer_name}
                      onChange={e => set("customer_name", e.target.value)}
                      placeholder="Your full name" autoFocus />
                  </label>
                  <label className={s.field}>
                    Email *
                    <input type="email" value={form.customer_email}
                      onChange={e => set("customer_email", e.target.value)}
                      placeholder="your@email.com" />
                  </label>
                  <label className={s.field}>
                    Phone *
                    <input type="tel" value={form.customer_phone}
                      onChange={e => set("customer_phone", e.target.value)}
                      placeholder="+91 98765 43210" />
                  </label>
                  <label className={s.field}>
                    Nationality
                    <input type="text" value={form.nationality}
                      onChange={e => set("nationality", e.target.value)} />
                  </label>
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div className={s.fields}>
                  <label className={s.field}>
                    Travel Date *
                    <input type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={form.travel_date}
                      onChange={e => set("travel_date", e.target.value)} />
                  </label>
                  <div className={s.row}>
                    <label className={s.field}>
                      Persons
                      <input type="number" min={1} max={trip?.max_capacity || 30}
                        value={form.persons}
                        onChange={e => set("persons", e.target.value)} />
                    </label>
                    <label className={s.field}>
                      Group Type
                      <select value={form.group_type} onChange={e => set("group_type", e.target.value)}>
                        {GROUPS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className={s.field}>
                    Special Requests
                    <textarea rows={2} value={form.special_requests}
                      onChange={e => set("special_requests", e.target.value)}
                      placeholder="Dietary needs, preferences..." />
                  </label>

                  <p className={s.secLabel}>Transport</p>
                  <div className={s.cabs}>
                    {CABS.map(c => (
                      <div key={c.value}
                        className={`${s.cab} ${form.cab_type === c.value ? s.cabOn : ""}`}
                        onClick={() => set("cab_type", c.value)}
                      >
                        <span className={s.cabIcon}>{c.icon}</span>
                        <div>
                          <strong>{c.label}</strong>
                          <span>{c.price === 0 ? "Free" : `+${fmt(c.price)}`}</span>
                          <small>{c.desc}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className={s.confirm}>
                  <table className={s.table}>
                    <tbody>
                      {[
                        ["Trip", trip?.title], ["Name", form.customer_name],
                        ["Email", form.customer_email], ["Phone", form.customer_phone],
                        ["Date", form.travel_date], ["Persons", form.persons],
                        ["Group", form.group_type], ["Transport", cab.label],
                      ].map(([k, v]) => (
                        <tr key={k}>
                          <td className={s.tk}>{k}</td>
                          <td className={s.tv}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className={s.totals}>
                    <div className={s.totalRow}>
                      <span>Trip × {form.persons}</span>
                      <span>{fmt(tripCost)}</span>
                    </div>
                    {cab.price > 0 && (
                      <div className={s.totalRow}>
                        <span>{cab.label}</span>
                        <span>{fmt(cab.price)}</span>
                      </div>
                    )}
                    <div className={`${s.totalRow} ${s.grand}`}>
                      <strong>Total</strong>
                      <strong>{fmt(total)}</strong>
                    </div>
                  </div>

                  {error && (
                    <motion.div className={s.errBox}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    >
                      ⚠ {error.message}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={s.foot}>
          <button className={s.btnSec}
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
            {step > 0 ? "← Back" : "Cancel"}
          </button>
          {step < 2 ? (
            <button className={s.btnPri} disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className={s.btnPri} disabled={isPending} onClick={() => mutate()}>
              {isPending
                ? <><span className={s.spinner} /> Confirming…</>
                : "Confirm Booking ✓"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
