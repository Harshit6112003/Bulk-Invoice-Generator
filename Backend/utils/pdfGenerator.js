const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const generatePDFBuffer = async (invoiceData) => {
  try {
    invoiceData.invoiceId ||= invoiceData.id || Math.floor(1000 + Math.random() * 9000);
    invoiceData.date ||= new Date().toLocaleDateString('en-GB');
    
    // Use provided logos or fallbacks
    const defaultLogoPath = path.join(__dirname, '../public/image/FW_logo_new.png');
    const defaultSignaturePath = path.join(__dirname, '../public/image/signature.png');
    
    const logoBase64 = invoiceData.company?.logo?.startsWith('data:image')
      ? invoiceData.company.logo
      : fs.existsSync(defaultLogoPath)
        ? `data:image/png;base64,${fs.readFileSync(defaultLogoPath).toString('base64')}`
        : '';
    
    const signatureBase64 = invoiceData.company?.signature?.startsWith('data:image')
      ? invoiceData.company.signature
      : fs.existsSync(defaultSignaturePath)
        ? `data:image/png;base64,${fs.readFileSync(defaultSignaturePath).toString('base64')}`
        : '';
    
    // Prepare template data with currency code included
    const templateData = {
      invoice: {
        invoiceId: invoiceData.invoiceId,
        date: invoiceData.date,
        name: invoiceData.name || 'N/A',
        email: invoiceData.email || 'N/A',
        phone: invoiceData.phone || 'N/A',
        description: invoiceData.description || 'Service',
        amount: Number(invoiceData.amount) || 0,
        tax: Number(invoiceData.tax) || 0,
        total: Number(invoiceData.total) || 0,
        items: invoiceData.items || [],
        amountInWords: invoiceData.amountInWords || 'Zero',
        currency: invoiceData.currency || 'INR',  // Added line here
      },
      company: {
        name: invoiceData.company?.name || 'Your Company',
        address: invoiceData.company?.address || '',
        email: invoiceData.company?.email || '',
        phone: invoiceData.company?.phone || '',
        gstin: invoiceData.company?.gstin || '',
        logo: logoBase64,
        signature: signatureBase64,
        accountName: invoiceData.company?.accountName || '',
        accountNumber: invoiceData.company?.accountNumber || '',
        ifsc: invoiceData.company?.ifsc || '',
        bankDetails: invoiceData.company?.bankDetails || '',
        companyDetails: invoiceData.company?.companyDetails || '',
        termsAndConditions: invoiceData.company?.termsAndConditions || '',
      },
    };
    
    const templatePath = path.join(__dirname, '../views/invoiceTemplate.ejs');
    if (!fs.existsSync(templatePath)) throw new Error(`Missing template: ${templatePath}`);
    
    const html = await ejs.renderFile(templatePath, templateData, { async: true });
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();
    return pdfBuffer;
  
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    throw error;
  }
};

module.exports = { generatePDFBuffer };
