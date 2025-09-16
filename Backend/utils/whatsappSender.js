const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsApp = async (to, invoice) => {
  const message = `Hi ${invoice.name}, your invoice of ₹${invoice.total} is ready.`;
  await client.messages.create({
    body: message,
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${to}`,
  });
};

module.exports = sendWhatsApp;
