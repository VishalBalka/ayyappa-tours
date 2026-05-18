const axios = require("axios");

const sendEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️  BREVO_API_KEY not set — skipping email");
    return;
  }
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Ayyappa Tours", email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("Email error:", err.response?.data || err.message);
    throw err;
  }
};