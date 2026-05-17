const axios = require("axios");

const BASE = "https://graph.facebook.com/v19.0";

/**
 * Send WhatsApp message via Meta Cloud API
 * @param {string} to   - phone with country code, no +  e.g. "919573680120"
 * @param {string} body - message text (plain or with *bold*)
 */
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

module.exports = { sendWhatsApp };