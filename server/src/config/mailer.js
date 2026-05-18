const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("Email service ready");
} else {
  console.log("Email not configured - set EMAIL_USER and EMAIL_PASS in .env");
}

module.exports = null; // SMTP not used — using Brevo HTTP API