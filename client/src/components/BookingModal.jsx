import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import s from "./BookingModal.module.css";

const INIT = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  place: "",
  travel_date: "",
  persons: 1,
  special_requests: "",
};

const sanitize = (str) =>
  typeof str === "string" ? str.replace(/[<>"'%;()&+]/g, "").trim() : str;

export default function BookingModal({ trip, onClose }) {
  const [form, setForm] = useState({
    ...INIT,
    place: trip?.location || "",
  });
  const [done, setDone] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isValid =
    form.customer_name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email) &&
    form.customer_phone.trim().length >= 7 &&
    form.travel_date !== "" &&
    Number(form.persons) >= 1;

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      api.createBooking({
        customer_name:    sanitize(form.customer_name),
        customer_email:   sanitize(form.customer_email),
        customer_phone:   sanitize(form.customer_phone),
        place:            sanitize(form.place),
        travel_date:      form.travel_date,
        persons:          Number(form.persons),
        special_requests: sanitize(form.special_requests) || null,
      }),
    onSuccess: (data) => setDone(data),
  });

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    const ref = done.booking?.reference || done.reference || "—";
    return (
      <div className={s.overlay} onClick={onClose}>
        <motion.div
          className={s.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className={s.success}>
            <motion.div
              className={s.successRing}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, delay: 0.1 }}
            >
              <span>✓</span>
            </motion.div>
            <h2>Booking Received!</h2>
            <p>
              Thank you, <strong>{form.customer_name}</strong>! We've received your
              inquiry and will contact you within 24 hours.
            </p>
            <div className={s.refBox}>
              <span className={s.refLabel}>Your Reference Number</span>
              <strong className={s.refCode}>{ref}</strong>
            </div>
            <p className={s.refNote}>
              A confirmation email has been sent to{" "}
              <strong>{form.customer_email}</strong>
            </p>
            <button className={s.closeSuccessBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <motion.div
        className={s.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
      >
        {/* Header */}
        <div className={s.head}>
          <div className={s.headLeaf}>🌿</div>
          <div className={s.headText}>
            <p className={s.headTag}>BOOKING INQUIRY</p>
            <h2 className={s.headTitle}>{trip?.title || "Book a Tour"}</h2>
            {trip?.location && (
              <p className={s.headSub}>📍 {trip.location}{trip?.duration ? ` · ${trip.duration}` : ""}</p>
            )}
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Note bar */}
        <div className={s.noteBar}>
          <span>📞</span>
          <span>Free inquiry — no payment required. We'll confirm within 24 hours.</span>
        </div>

        {/* Body */}
        <div className={s.body}>
          <div className={s.fields}>

            {/* Name + Phone row */}
            <div className={s.row}>
              <label className={s.field}>
                <span className={s.fieldLabel}>Full Name *</span>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                  autoFocus
                />
              </label>
              <label className={s.field}>
                <span className={s.fieldLabel}>Phone Number *</span>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) =>
                    set("customer_phone", e.target.value.replace(/[^0-9+\-\s]/g, ""))
                  }
                  placeholder="+91 98765 43210"
                  maxLength={20}
                />
              </label>
            </div>

            {/* Email */}
            <label className={s.field}>
              <span className={s.fieldLabel}>Email Address *</span>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => set("customer_email", e.target.value)}
                placeholder="your@email.com"
                maxLength={150}
              />
            </label>

            {/* Destination + Persons row */}
            <div className={s.row}>
              <label className={s.field}>
                <span className={s.fieldLabel}>Destination / Place</span>
                <input
                  type="text"
                  value={form.place}
                  onChange={(e) => set("place", e.target.value)}
                  placeholder="e.g. Munnar, Kerala"
                  maxLength={255}
                />
              </label>
              <label className={s.field}>
                <span className={s.fieldLabel}>Number of Persons *</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.persons}
                  onChange={(e) => set("persons", e.target.value)}
                />
              </label>
            </div>

            {/* Travel date */}
            <label className={s.field}>
              <span className={s.fieldLabel}>Preferred Travel Date *</span>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.travel_date}
                onChange={(e) => set("travel_date", e.target.value)}
              />
            </label>

            {/* Special requests */}
            <label className={s.field}>
              <span className={s.fieldLabel}>Special Requests (optional)</span>
              <textarea
                rows={3}
                value={form.special_requests}
                onChange={(e) => set("special_requests", e.target.value)}
                placeholder="Dietary needs, accessibility, preferred activities..."
                maxLength={500}
              />
            </label>
          </div>

          {error && (
            <motion.div
              className={s.errBox}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ⚠ {error.response?.data?.error || error.message}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className={s.foot}>
          <button className={s.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            className={s.btnSubmit}
            disabled={!isValid || isPending}
            onClick={() => mutate()}
          >
            {isPending ? (
              <><span className={s.spinner} /> Sending…</>
            ) : (
              "Send Booking Request ✓"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}