const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("Email service ready");
} else {
  console.log("Email not configured - set EMAIL_USER and EMAIL_PASS in .env");
}

module.exports = transporter;
