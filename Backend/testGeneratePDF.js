const fs = require('fs');
const path = require('path');
const {generatePDFBuffer} = require('./utils/pdfGenerator'); // adjust path if needed


(async () => {
  try {
    const pdfBuffer = await generatePDFBuffer(sampleInvoiceData);

    const outputPath = path.join(__dirname, 'sample_invoice.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('✅ PDF generated successfully:', outputPath);
  } catch (err) {
    console.error('❌ Error generating PDF:', err.message);
  }
})();
