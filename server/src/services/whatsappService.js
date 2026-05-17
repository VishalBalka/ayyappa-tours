async function sendWhatsAppToAdmin(booking) {
  try {
    const adminPhone = process.env.ADMIN_PHONE || "919573680120";
    const text = [
      "New Booking - Ayyappa Tours",
      "Reference: " + booking.reference,
      "Name: " + booking.customer_name,
      "Phone: " + (booking.customer_phone || "N/A"),
      "Email: " + booking.customer_email,
      "Destination: " + (booking.place || "Not specified"),
      "Date: " + booking.travel_date,
      "Persons: " + booking.persons,
      booking.special_requests ? "Notes: " + booking.special_requests : "",
      "Login to admin panel to confirm."
    ].filter(Boolean).join("\n");
    const link = "https://wa.me/" + adminPhone + "?text=" + encodeURIComponent(text);
    console.log("WhatsApp admin link: " + link);
    return { link };
  } catch (err) {
    console.error("sendWhatsAppToAdmin error:", err.message);
    return null;
  }
}

async function sendWhatsAppToCustomer(booking) {
  try {
    if (!booking.customer_phone) return null;
    const phone = booking.customer_phone.toString().replace(/[^\d]/g, "");
    if (phone.length < 7) return null;
    const isConfirmed = booking.status === "confirmed";
    const text = isConfirmed
      ? [
          "Ayyappa Tours - Booking Confirmed",
          "Hello " + booking.customer_name + "!",
          "Your trip is CONFIRMED.",
          "Reference: " + booking.reference,
          "Destination: " + (booking.place || "Not specified"),
          "Date: " + booking.travel_date,
          "Persons: " + booking.persons,
          "Our team will contact you shortly.",
          "Questions? wa.me/919573680120"
        ].join("\n")
      : [
          "Ayyappa Tours - Booking Received",
          "Hello " + booking.customer_name + "!",
          "We have received your inquiry.",
          "Reference: " + booking.reference,
          "Destination: " + (booking.place || "Not specified"),
          "Date: " + booking.travel_date,
          "Persons: " + booking.persons,
          "We will confirm within 24 hours.",
          "Questions? wa.me/919573680120"
        ].join("\n");
    const link = "https://wa.me/" + phone + "?text=" + encodeURIComponent(text);
    console.log("WhatsApp customer link: " + link);
    return { link };
  } catch (err) {
    console.error("sendWhatsAppToCustomer error:", err.message);
    return null;
  }
}

module.exports = { sendWhatsAppToAdmin, sendWhatsAppToCustomer };
