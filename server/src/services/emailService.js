const transporter = require("../config/mailer");

const sendEmail = async (to, subject, html) => {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: '"Ayyappa Tours" <' + process.env.EMAIL_USER + ">",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email error:", err.message);
  }
};

const sendBookingReceived = async (booking, trip) => {
  await sendEmail(
    booking.customer_email,
    "Booking Received - Ayyappa Tours",
    "<div style='font-family:Georgia,serif;max-width:600px;background:#0f1a0f;color:#e8f5e9;padding:40px;border-radius:12px'>" +
      "<h1 style='color:#4ade80'>Booking Received!</h1>" +
      "<p>Thank you, " + booking.customer_name + ". We have received your booking.</p>" +
      "<div style='background:#1a2e1a;padding:20px;border-radius:8px;margin:20px 0'>" +
        "<p><strong style='color:#4ade80'>Reference:</strong> " + booking.reference + "</p>" +
        "<p><strong style='color:#4ade80'>Trip:</strong> " + trip.title + "</p>" +
        "<p><strong style='color:#4ade80'>Date:</strong> " + booking.travel_date + "</p>" +
        "<p><strong style='color:#4ade80'>Persons:</strong> " + booking.persons + "</p>" +
        "<p><strong style='color:#4ade80'>Total:</strong> Rs." + booking.total_price + "</p>" +
      "</div>" +
      "<p style='color:#86efac'>We will confirm within 24 hours.</p>" +
    "</div>"
  );
};

const sendBookingConfirmed = async (booking) => {
  await sendEmail(
    booking.customer_email,
    "Booking Confirmed - Ayyappa Tours",
    "<div style='font-family:Georgia,serif;max-width:600px;background:#0f1a0f;color:#e8f5e9;padding:40px;border-radius:12px'>" +
      "<h1 style='color:#4ade80'>Booking Confirmed!</h1>" +
      "<p>Dear " + booking.customer_name + ", your Kerala adventure is booked!</p>" +
      "<div style='background:#1a2e1a;padding:20px;border-radius:8px;margin:20px 0'>" +
        "<p><strong style='color:#4ade80'>Reference:</strong> " + booking.reference + "</p>" +
        "<p><strong style='color:#4ade80'>Travel Date:</strong> " + booking.travel_date + "</p>" +
        "<p><strong style='color:#4ade80'>Total:</strong> Rs." + booking.total_price + "</p>" +
      "</div>" +
    "</div>"
  );
};

const sendAdminNewBooking = async (booking, trip) => {
  await sendEmail(
    process.env.ADMIN_EMAIL,
    "New Booking - Ayyappa Tours",
    "<div style='font-family:sans-serif;padding:20px;border-left:4px solid #4ade80'>" +
      "<h3>New Booking</h3>" +
      "<p><b>Reference:</b> " + booking.reference + "</p>" +
      "<p><b>Customer:</b> " + booking.customer_name + " (" + booking.customer_email + ")</p>" +
      "<p><b>Trip:</b> " + trip.title + "</p>" +
      "<p><b>Date:</b> " + booking.travel_date + "</p>" +
      "<p><b>Persons:</b> " + booking.persons + "</p>" +
      "<p><b>Total:</b> Rs." + booking.total_price + "</p>" +
    "</div>"
  );
};

const sendAdminLoginAlert = async (username, ip) => {
  await sendEmail(
    process.env.ADMIN_EMAIL,
    "Admin Login Alert - Ayyappa Tours",
    "<div style='font-family:sans-serif;padding:20px;border-left:4px solid #f59e0b'>" +
      "<h3>Admin Login Detected</h3>" +
      "<p><b>Username:</b> " + username + "</p>" +
      "<p><b>IP:</b> " + ip + "</p>" +
      "<p><b>Time:</b> " + new Date().toLocaleString() + "</p>" +
    "</div>"
  );
};

module.exports = {
  sendEmail,
  sendBookingReceived,
  sendBookingConfirmed,
  sendAdminNewBooking,
  sendAdminLoginAlert,
};
