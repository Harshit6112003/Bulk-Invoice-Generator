const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async (to, subject, invoiceData = null, pdfBuffer = null, customHtml = null) => {
  if (!to || !isValidEmail(to)) {
    throw new Error(`Invalid recipient email: ${to}`);
  }

  try {
    const transporter = createTransporter(); // Create transporter fresh for each send

    let htmlContent;

    if (customHtml) {
      htmlContent = customHtml;
    } else if (invoiceData) {
      const logoPath = path.join(__dirname, '../public/image/FW_logo_new.png');
      const logoBase64 = fs.existsSync(logoPath)
        ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
        : '';

      const signaturePath = path.join(__dirname, '../public/image/signature.png');
      const signatureBase64 = fs.existsSync(signaturePath)
        ? `data:image/png;base64,${fs.readFileSync(signaturePath).toString('base64')}`
        : '';

      const templateData = {
        invoice: invoiceData,
        company: invoiceData.company || {},
        logo: logoBase64,
        signature: signatureBase64,
      };

      const templatePath = path.join(__dirname, '../views/invoiceTemplate.ejs');
      htmlContent = await ejs.renderFile(templatePath, templateData);
    } else {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Notification</h2>
          <p>${subject}</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Your Company" <${process.env.EMAIL_ID}>`,
      to,
      subject,
      html: htmlContent,
    };

    if (pdfBuffer && invoiceData) {
      mailOptions.attachments = [
        {
          filename: `invoice_FW-${invoiceData.invoiceId || Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    console.log('Accepted recipients:', info.accepted);
    console.log('Rejected recipients:', info.rejected);

    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email rejected for recipients: ${info.rejected.join(', ')}`);
    }
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
