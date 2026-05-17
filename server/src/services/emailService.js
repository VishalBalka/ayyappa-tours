const transporter = require("../config/mailer");

// ── Core send helper ──────────────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.warn("⚠️  Email transporter not configured — skipping email");
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Ayyappa Tours" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email error:", err.message);
    throw err; // re-throw so safeSend can log it
  }
};

// ── Shared styles ─────────────────────────────────────────────────────────
const emailWrap = (content) => `
  <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;
              background:#f9fdf9;color:#1a3a1a;border-radius:16px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,80,0,0.08)">
    <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);
                padding:32px 40px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:1.6rem;letter-spacing:1px">
        🌿 Ayyappa Tours
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem">
        Kerala's Finest Travel Experience
      </p>
    </div>
    <div style="padding:36px 40px">${content}</div>
    <div style="background:#e8f5e9;padding:20px 40px;text-align:center;
                font-size:0.78rem;color:#4a7c59">
      © ${new Date().getFullYear()} Ayyappa Tours · Kerala, India<br>
      <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || '919573680120'}"
         style="color:#2d6a4f;text-decoration:none">📱 WhatsApp Us</a>
    </div>
  </div>
`;

const detailRow = (label, value) =>
  value
    ? `<tr>
        <td style="padding:8px 0;color:#4a7c59;font-size:0.88rem;width:140px">
          <strong>${label}</strong>
        </td>
        <td style="padding:8px 0;font-size:0.88rem;color:#1a3a1a">${value}</td>
       </tr>`
    : "";

// ── Booking received — sent to CUSTOMER ───────────────────────────────────
const sendBookingReceived = async (booking) => {
  const date = booking.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">Booking Received!</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      Thank you, <strong>${booking.customer_name}</strong>! We've received your inquiry
      and our team will confirm your booking within 24 hours.
    </p>

    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;
                padding:24px;margin-bottom:24px">
      <h3 style="margin:0 0 16px;color:#2d6a4f;font-size:1rem">Booking Details</h3>
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Reference", `<code style="background:#e8f5e9;padding:2px 8px;border-radius:4px;font-size:0.9rem">${booking.reference}</code>`)}
        ${detailRow("Name", booking.customer_name)}
        ${detailRow("Email", booking.customer_email)}
        ${detailRow("Phone", booking.customer_phone)}
        ${detailRow("Destination", booking.place)}
        ${detailRow("Travel Date", date)}
        ${detailRow("Persons", booking.persons)}
        ${detailRow("Special Requests", booking.special_requests)}
      </table>
    </div>

    <div style="background:#e8f5e9;border-radius:10px;padding:16px 20px;
                border-left:4px solid #40916c">
      <p style="margin:0;font-size:0.88rem;color:#2d6a4f">
        📞 Need help? WhatsApp us at
        <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || '919573680120'}"
           style="color:#2d6a4f;font-weight:bold">
          +${process.env.WHATSAPP_NUMBER || '919573680120'}
        </a>
        or reply to this email.
      </p>
    </div>
  `;

  await sendEmail(
    booking.customer_email,
    `Booking Received — Ref: ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── Booking confirmed — sent to CUSTOMER when admin confirms ──────────────
const sendBookingConfirmed = async (booking) => {
  const date = booking.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">✅ Booking Confirmed!</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      Great news, <strong>${booking.customer_name}</strong>! Your Kerala adventure is
      officially confirmed. Pack your bags — we can't wait to show you the best of Kerala!
    </p>

    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;
                padding:24px;margin-bottom:24px">
      <h3 style="margin:0 0 16px;color:#2d6a4f;font-size:1rem">Your Booking</h3>
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Reference", `<code style="background:#e8f5e9;padding:2px 8px;border-radius:4px;font-size:0.9rem">${booking.reference}</code>`)}
        ${detailRow("Destination", booking.place)}
        ${detailRow("Travel Date", date)}
        ${detailRow("Persons", booking.persons)}
      </table>
    </div>

    <p style="font-size:0.88rem;color:#4a7c59">
      Our team will reach out to discuss the full itinerary and any details.
      Keep this email for your records.
    </p>
  `;

  await sendEmail(
    booking.customer_email,
    `Booking Confirmed — Ref: ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── New booking alert — sent to ADMIN ─────────────────────────────────────
const sendAdminNewBooking = async (booking) => {
  const date = booking.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const content = `
    <h2 style="color:#2d6a4f;margin:0 0 8px">🔔 New Booking Inquiry</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      A new booking has been submitted. Log in to your admin panel to confirm or manage it.
    </p>

    <div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;
                padding:24px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Reference", booking.reference)}
        ${detailRow("Customer", booking.customer_name)}
        ${detailRow("Email", booking.customer_email)}
        ${detailRow("Phone", booking.customer_phone)}
        ${detailRow("Destination", booking.place)}
        ${detailRow("Travel Date", date)}
        ${detailRow("Persons", booking.persons)}
        ${detailRow("Special Requests", booking.special_requests)}
        ${detailRow("Submitted", new Date(booking.created_at).toLocaleString("en-IN"))}
      </table>
    </div>
  `;

  await sendEmail(
    process.env.ADMIN_EMAIL,
    `🔔 New Booking — ${booking.reference} | Ayyappa Tours`,
    emailWrap(content)
  );
};

// ── Admin login alert ─────────────────────────────────────────────────────
const sendAdminLoginAlert = async (username, ip) => {
  const content = `
    <h2 style="color:#e65100;margin:0 0 8px">⚠️ Admin Login Alert</h2>
    <p style="margin:0 0 24px;color:#4a7c59">
      A login to the Ayyappa Tours admin panel was detected.
    </p>
    <div style="background:#fff;border:1px solid #ffccbc;border-radius:12px;
                padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Username", username)}
        ${detailRow("IP Address", ip)}
        ${detailRow("Time", new Date().toLocaleString("en-IN"))}
      </table>
    </div>
    <p style="margin-top:20px;font-size:0.85rem;color:#bf360c">
      If this wasn't you, change your admin password immediately.
    </p>
  `;

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