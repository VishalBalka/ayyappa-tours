const axios = require("axios");

const sendEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set - skipping email");
    return;
  }
  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender: { name: "Ayyappa Tours", email: process.env.EMAIL_USER || "vishalbalkaofficial@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent,
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" },
    });
    console.log("Email sent to " + to);
  } catch (err) {
    console.error("Email error:", err.response?.data?.message || err.message);
    throw err;
  }
};

const emailWrap = (content) => `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#f9fdf9;color:#1a3a1a;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:32px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:1.6rem">Ayyappa Tours</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem">Kerala's Finest Travel Experience</p></div><div style="padding:36px 40px">${content}</div><div style="background:#e8f5e9;padding:20px 40px;text-align:center;font-size:0.78rem;color:#4a7c59">Ayyappa Tours - Kerala, India</div></div>`;

const detailRow = (label, value) => value ? `<tr><td style="padding:8px 0;color:#4a7c59;font-size:0.88rem;width:140px"><strong>${label}</strong></td><td style="padding:8px 0;font-size:0.88rem;color:#1a3a1a">${value}</td></tr>` : "";

const sendBookingReceived = async (booking) => {
  const date = booking.travel_date ? new Date(booking.travel_date).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "-";
  const content = `<h2 style="color:#2d6a4f">Booking Received!</h2><p>Thank you, <strong>${booking.customer_name}</strong>! We will confirm within 24 hours.</p><div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px"><table style="width:100%;border-collapse:collapse">${detailRow("Reference", booking.reference)}${detailRow("Destination", booking.place)}${detailRow("Travel Date", date)}${detailRow("Persons", booking.persons)}${detailRow("Special Requests", booking.special_requests)}</table></div>`;
  await sendEmail(booking.customer_email, `Booking Received - Ref: ${booking.reference} | Ayyappa Tours`, emailWrap(content));
};

const sendBookingConfirmed = async (booking) => {
  const date = booking.travel_date ? new Date(booking.travel_date).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "-";
  const content = `<h2 style="color:#2d6a4f">Booking Confirmed!</h2><p>Great news, <strong>${booking.customer_name}</strong>! Your Kerala adventure is confirmed!</p><div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px"><table style="width:100%;border-collapse:collapse">${detailRow("Reference", booking.reference)}${detailRow("Destination", booking.place)}${detailRow("Travel Date", date)}${detailRow("Persons", booking.persons)}</table></div>`;
  await sendEmail(booking.customer_email, `Booking Confirmed - Ref: ${booking.reference} | Ayyappa Tours`, emailWrap(content));
};

const sendAdminNewBooking = async (booking) => {
  const date = booking.travel_date ? new Date(booking.travel_date).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "-";
  const content = `<h2 style="color:#2d6a4f">New Booking Inquiry</h2><div style="background:#fff;border:1px solid #c8e6c9;border-radius:12px;padding:24px"><table style="width:100%;border-collapse:collapse">${detailRow("Reference", booking.reference)}${detailRow("Customer", booking.customer_name)}${detailRow("Email", booking.customer_email)}${detailRow("Phone", booking.customer_phone)}${detailRow("Destination", booking.place)}${detailRow("Travel Date", date)}${detailRow("Persons", booking.persons)}${detailRow("Special Requests", booking.special_requests)}</table></div>`;
  await sendEmail(process.env.ADMIN_EMAIL, `New Booking - ${booking.reference} | Ayyappa Tours`, emailWrap(content));
};

const sendAdminLoginAlert = async (username, ip) => {
  const content = `<h2 style="color:#e65100">Admin Login Alert</h2><div style="background:#fff;border:1px solid #ffccbc;border-radius:12px;padding:24px"><table style="width:100%;border-collapse:collapse">${detailRow("Username", username)}${detailRow("IP Address", ip)}${detailRow("Time", new Date().toLocaleString("en-IN"))}</table></div>`;
  await sendEmail(process.env.ADMIN_EMAIL, "Admin Login Alert | Ayyappa Tours", emailWrap(content));
};

module.exports = { sendEmail, sendBookingReceived, sendBookingConfirmed, sendAdminNewBooking, sendAdminLoginAlert };
