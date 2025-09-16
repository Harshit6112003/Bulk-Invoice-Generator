const xlsx = require("xlsx");
const { generatePDFBuffer } = require("../utils/pdfGenerator");
const emailSender = require("../utils/emailSender");

exports.processInvoices = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

    const parsedInvoices = [];

    for (const [index, row] of data.entries()) {
      try {
        if (!row.Email || !row.Name || !row.Amount) {
          console.warn(`⚠️ Skipping row ${index + 1}: missing required fields.`);
          continue;
        }

        const pdfBuffer = await generatePDFBuffer(row);
        await emailSender.sendInvoice(row.Email, pdfBuffer);

        parsedInvoices.push({
          ...row,
          status: "✅ Sent",
        });
      } catch (err) {
        console.error(`❌ Failed to send invoice to: ${row.Email}`, err.message);
        parsedInvoices.push({
          ...row,
          status: `❌ Failed: ${err.message}`,
        });
      }
    }

    return parsedInvoices;
  } catch (err) {
    console.error("❌ Failed to process Excel file:", err.message);
    throw new Error("Failed to process Excel file.");
  }
};
