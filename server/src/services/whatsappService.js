const generateWhatsAppLink = (reference, tripTitle) => {
  const number = process.env.WHATSAPP_NUMBER || "919573680120";
  const message =
    "Hello! I have a booking with Ayyappa Tours.\n" +
    "Reference: " + reference + "\n" +
    "Trip: " + tripTitle + "\n" +
    "Please confirm my booking.";
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
};

module.exports = generateWhatsAppLink;
