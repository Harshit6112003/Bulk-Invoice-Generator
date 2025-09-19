const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/emailSender');
// const sendWhatsApp = require('../utils/whatsappSender');
const { generatePDFBuffer } = require('../utils/pdfGenerator');

router.post('/api/send-invoices', async (req, res) => {
  const { invoices, channels } = req.body;

  if (!Array.isArray(invoices) || typeof channels !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request format' });
  }

  const results = [];

  for (const invoice of invoices) {
    try {
      if (!invoice.id || !invoice.name || !invoice.total) {
        throw new Error('Invoice missing required fields');
      }

      // Extract currency code (default to INR)
      const currency = invoice.currency || 'INR';

      // Dynamically build items array
      const items = [];
      const keys = Object.keys(invoice);
      const descriptionKeys = keys.filter(k => k.toLowerCase().startsWith('description'));
      const indices = descriptionKeys.map(k => k.match(/\d+$/)?.[0]).filter(Boolean);

      const uniqueIndices = [...new Set(indices)].sort((a, b) => Number(a) - Number(b));

      for (const idx of uniqueIndices) {
        const description = typeof invoice[`description${idx}`] === 'string'
          ? invoice[`description${idx}`].trim()
          : '';
        const hours = Number(invoice[`hours${idx}`] || 0);
        const rate = Number(invoice[`rate${idx}`] || 0);
        const total = Number(invoice[`total${idx}`]) || hours * rate;

        if (description || hours || rate) {
          items.push({ description, hours, rate, total });
        }
      }

      // Prepare complete invoice data with currency
      const fullInvoiceData = {
        invoiceId: invoice.invoiceId || invoice.id,
        date: invoice.date || new Date().toLocaleDateString('en-GB'),
        name: invoice.name,
        email: invoice.email,
        phone: invoice.phone,
        description: invoice.description || 'Service',
        amount: Number(invoice.amount || items.reduce((sum, i) => sum + i.total, 0)),
        tax: Number(invoice.tax) || 0,
        total: Number(invoice.total || (invoice.amount || 0) + (invoice.tax || 0)),
        amountInWords: invoice.amountInWords || 'Zero',
        currency,  // added currency code here
        items,
        company: {
          name: invoice.company?.name || 'Your Company',
          address: invoice.company?.address || '',
          email: invoice.company?.email || '',
          phone: invoice.company?.phone || '',
          gstin: invoice.company?.gstin || '',
          accountName: invoice.company?.accountName || '',
          accountNumber: invoice.company?.accountNumber || '',
          ifsc: invoice.company?.ifsc || '',
          bankDetails: invoice.company?.bankDetails || '',
          companyDetails: invoice.company?.companyDetails || '',
          termsAndConditions: invoice.company?.termsAndConditions || '',
          logo: invoice.company?.logo || '',
          signature: invoice.company?.signature || '',
        }
      };

      // Generate PDF buffer for the invoice
      const pdfBuffer = await generatePDFBuffer(fullInvoiceData);

      // Send via requested channels
      if (channels.email && invoice.email) {
        await sendEmail(invoice.email, 'Your Invoice', fullInvoiceData, pdfBuffer);
      }
      
      // if (channels.whatsapp && invoice.phone) {
      //   await sendWhatsApp(invoice.phone, fullInvoiceData);
      // }

      results.push({ id: invoice.id, status: 'sent' });
    } catch (error) {
      console.error(`❌ Error sending invoice [${invoice.id || invoice.name}]:`, error);
      results.push({ id: invoice.id, status: 'failed', error: error.message });
    }
  }

  res.json({ success: true, results });
});

module.exports = router;
