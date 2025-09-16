const pdfGenerator = require("../utils/pdfGenerator");
const emailSender = require("../utils/emailSender");

exports.sendInvoices = async (req, res) => {
  
  const invoices = req.body.invoices;
  console.log(req.body);
  let sent = 0, failed = 0;

  for (const invoice of invoices) {
    try {
      if (!invoice.email) {
        console.warn(`Skipping invoice without email`, invoice);
        failed++;
        continue;
      }

      console.log(invoice);
      const pdfBuffer = await pdfGenerator.generatePDFBuffer(invoice);
      await emailSender.sendInvoice(invoice.email, pdfBuffer);
      sent++;
    } catch (err) {
      console.error(`❌ Failed to send for ${invoice.name}:`, err.message);
      failed++;
    }
  }

  res.json({ success: true, sent, failed });
};
