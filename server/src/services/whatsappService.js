const axios = require("axios");

const BASE = "https://graph.facebook.com/v19.0";

async function sendWhatsApp(to, body) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    console.warn("⚠️  WhatsApp not configured — skipping");
    return null;
  }

  const phone = to.toString().replace(/^\+/, "").replace(/\s/g, "");

  try {
    const res = await axios.post(
      `${BASE}/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ WhatsApp sent to ${phone} — ID: ${res.data.messages?.[0]?.id}`);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error(`❌ WhatsApp failed to ${phone}:`, detail);
    return null;
  }
}

// ── Called when a new booking is created ─────────────────────────────────
async function sendWhatsAppToAdmin(booking) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) {
    console.warn("⚠️  ADMIN_PHONE not set — skipping admin WhatsApp");
    return null;
  }

  const msg =
`🔔 *New Booking — Ayyappa Tours*

*Reference:* ${booking.reference}
*Name:* ${booking.customer_name}
*Phone:* ${booking.customer_phone || "N/A"}
*Email:* ${booking.customer_email}
*Destination:* ${booking.place || "Not specified"}
*Date:* ${booking.travel_date}
*Persons:* ${booking.persons}
${booking.special_requests ? `*Notes:* ${booking.special_requests}` : ""}

Log in to admin panel to confirm.`;

  return sendWhatsApp(adminPhone, msg);
}

// ── Called when booking is created OR confirmed ───────────────────────────
async function sendWhatsAppToCustomer(booking) {
  if (!booking.customer_phone) {
    console.warn("⚠️  No customer phone — skipping customer WhatsApp");
    return null;
  }

  const isConfirmed = booking.status === "confirmed";

  const msg = isConfirmed
    ? `✅ *Booking Confirmed — Ayyappa Tours*

Hello ${booking.customer_name}!

Your trip has been *confirmed* 🎉

*Reference:* ${booking.reference}
*Destination:* ${booking.place || "Not specified"}
*Travel Date:* ${booking.travel_date}
*Persons:* ${booking.persons}

Our team will contact you shortly with full details.
Questions? WhatsApp us: wa.me/919573680120`

    : `🌿 *Ayyappa Tours — Booking Received*

Hello ${booking.customer_name}!

Thank you for choosing Ayyappa Tours. We've received your inquiry.

*Reference:* ${booking.reference}
*Destination:* ${booking.place || "Not specified"}
*Travel Date:* ${booking.travel_date}
*Persons:* ${booking.persons}

Our team will confirm within 24 hours.
Questions? WhatsApp us: wa.me/919573680120`;

  return sendWhatsApp(booking.customer_phone, msg);
}

module.exports = { sendWhatsApp, sendWhatsAppToAdmin, sendWhatsAppToCustomer };