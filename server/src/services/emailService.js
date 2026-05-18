const axios = require("axios");

// ── Core send via Brevo HTTP API ──────────────────────────────────────────
const sendEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set - skipping email");
    return;
  }
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name:  "Ayyappa Tours",
          email: process.env.EMAIL_USER || "vishalbalkaofficial@gmail.com",
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key":      process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    console.log("Email sent to " + to);
  } catch (err) {
    console.error("Email error:", err.response?.data?.message || err.message);
    throw err;
  }
};

// ── Email layout ──────────────────────────────────────────────────────────
const emailWrap = (content) => `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#f9fdf9;color:#1a3a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,80,0,0.08)">
  <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:1.6rem;letter-spacing:1px">🌿 Ayyappa Tours</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem">Kerala's Finest Travel Experience</p>
  </div>
  <div style="padding:36px 40px">${content}</div>
  <div style="background:#e8f5e9;padding:20px 40px;text-align:center;font-size:0.78rem;color:#4a7c59">
    © ${new Date().getFullYear()} Ayyappa Tours · Kerala, India
  </div>
</div>`;

const row = (label, value) =>
  value
    ? `<tr>
        <td style="padding:8px 0;color:#4a7c59;font-size:0.88rem;width:140px"><strong>${label}</strong></td>
        <td style="padding:8px 0;font-size:0.88rem;color:#1a3a1a">${value}</td>
       </tr>`
    : "";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "-";

// ── Booking received → customer ───────────────────────────────────────────
const sendBookingReceived = async (booking) => {
  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">Booking Received!</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      Thank you, <strong>${booking.customer_name}</strong>! We have received your inquiry and will confirm within 24 hours.
    </p>
    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Reference", `<code style="background:#e8f5e9;padding:2px 8px;border-radius:4px">${booking.reference}</code>`)}
        ${row("Destination", booking.place)}
        ${row("Travel Date", formatDate(booking.travel_date))}
        ${row("Persons", booking.persons)}
        ${row("Special Requests", booking.special_requests)}
      </table>
    </div>
    <p style="margin-top:20px;font-size:0.85rem;color:#4a7c59">
      Questions? WhatsApp us: <a href="https://wa.me/919573680120" style="color:#2d6a4f">+91 9573680120</a>
    </p>`;
  await sendEmail(
    booking.customer_email,
    `Booking Received - Ref: ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── Booking confirmed → customer ──────────────────────────────────────────
const sendBookingConfirmed = async (booking) => {
  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">✅ Booking Confirmed!</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      Great news, <strong>${booking.customer_name}</strong>! Your Kerala adventure is confirmed. Pack your bags!
    </p>
    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Reference", `<code style="background:#e8f5e9;padding:2px 8px;border-radius:4px">${booking.reference}</code>`)}
        ${row("Destination", booking.place)}
        ${row("Travel Date", formatDate(booking.travel_date))}
        ${row("Persons", booking.persons)}
      </table>
    </div>
    <p style="margin-top:20px;font-size:0.85rem;color:#4a7c59">
      Our team will contact you shortly with full details.
    </p>`;
  await sendEmail(
    booking.customer_email,
    `Booking Confirmed - Ref: ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── New booking alert → admin ─────────────────────────────────────────────
const sendAdminNewBooking = async (booking) => {
  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">🔔 New Booking Inquiry</h2>
    <p style="margin:0 0 24px;color:#4a7c59">A new booking has been submitted. Log in to confirm or manage it.</p>
    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Reference",       booking.reference)}
        ${row("Customer",        booking.customer_name)}
        ${row("Email",           booking.customer_email)}
        ${row("Phone",           booking.customer_phone)}
        ${row("Destination",     booking.place)}
        ${row("Travel Date",     formatDate(booking.travel_date))}
        ${row("Persons",         booking.persons)}
        ${row("Special Requests",booking.special_requests)}
        ${row("Submitted",       new Date(booking.created_at).toLocaleString("en-IN"))}
      </table>
    </div>`;
  await sendEmail(
    process.env.ADMIN_EMAIL,
    `🔔 New Booking - ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── Admin login alert → admin ─────────────────────────────────────────────
const sendAdminLoginAlert = async (username, ip) => {
  const content = `
    <h2 style="color:#e65100;margin:0 0 8px">⚠️ Admin Login Alert</h2>
    <p style="margin:0 0 24px;color:#4a7c59">A login to the admin panel was detected.</p>
    <div style="background:#fff;border:1px solid #ffccbc;border-radius:12px;padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Username",   username)}
        ${row("IP Address", ip)}
        ${row("Time",       new Date().toLocaleString("en-IN"))}
      </table>
    </div>
    <p style="margin-top:20px;font-size:0.85rem;color:#bf360c">
      If this was not you, change your admin password immediately.
    </p>`;
  await sendEmail(
    process.env.ADMIN_EMAIL,
    "⚠️ Admin Login Alert | Ayyappa Tours",
    emailWrap(content)
  );
};

module.exports = {
  sendEmail,
  sendBookingReceived,
  sendBookingConfirmed,
  sendAdminNewBooking,
  sendAdminLoginAlert,
};