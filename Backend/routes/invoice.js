const express = require("express");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const VIEWS_DIR = path.resolve(__dirname, "../views");
const EJS_TEMPLATE_PATH = path.join(VIEWS_DIR, "invoiceTemplate.ejs");
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const DEFAULT_LOGO_PATH = path.join(PUBLIC_DIR, "image", "FW_logo_new.png");
const DEFAULT_SIGNATURE_PATH = path.join(PUBLIC_DIR, "image", "default-signature.png");

let cachedLogo = null;
let cachedSignature = null;

function loadImageBase64(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace(".", "") || "png";
      return `data:image/${ext};base64,${buffer.toString("base64")}`;
    }
  } catch (e) {
    console.warn("Image read error:", e.message);
  }
  return null;
}

router.post("/api/render-invoice", async (req, res) => {
  const { invoiceData, invoiceTemplate } = req.body || {};

  if (!invoiceData || !invoiceTemplate) {
    return res.status(400).send("Missing invoiceData or invoiceTemplate in request body.");
  }

  try {
    let logoBase64 = invoiceTemplate.logo || cachedLogo;
    if (!logoBase64) {
      cachedLogo = loadImageBase64(DEFAULT_LOGO_PATH);
      logoBase64 = cachedLogo;
    }

    let signatureBase64 = invoiceTemplate.signature || cachedSignature;
    if (!signatureBase64) {
      cachedSignature = loadImageBase64(DEFAULT_SIGNATURE_PATH);
      signatureBase64 = cachedSignature;
    }

    // Dynamic extraction of items
    const items = [];
    const prefix = "description";
    const keys = Object.keys(invoiceData);
    const itemIndices = new Set();

    // Collect all indices present for description fields
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        const index = key.substring(prefix.length);
        if (index) itemIndices.add(index);
      }
    });

    // Process each item safely
    itemIndices.forEach((index) => {
      const descRaw = invoiceData[`description${index}`];
      const description = typeof descRaw === "string" ? descRaw.trim() : "";
      const hours = Number(invoiceData[`hours${index}`] || 0);
      const rate = Number(invoiceData[`rate${index}`] || 0);
      const total = hours * rate;

      if (description || hours || rate) {
        items.push({ description, hours, rate, total });
      }
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number(invoiceData.tax || 0);
    const totalAmount = Number(invoiceData.total || subtotal + tax);

   const company = {
  logo: logoBase64 || "",
  name: invoiceTemplate.companyName || "Your Company",
  address: invoiceTemplate.companyAddress || "",
  email: invoiceTemplate.companyEmail|| "",            
  phone: invoiceTemplate.companyPhone || "",            
  gstin: invoiceTemplate.gstin || "",
  accountName: invoiceTemplate.accountName || "",
  accountNumber: invoiceTemplate.accountNumber || "",
  ifsc: invoiceTemplate.ifsc || "",
  bankDetails: invoiceTemplate.bankDetails || "",
  contactAddress: invoiceTemplate.contactAddress || "",
  companyDetails: invoiceTemplate.companyDetails || "",
  signature: signatureBase64 || "",
  termsAndConditions: invoiceTemplate.termsAndConditions || "",
};

    const dataForTemplate = {
      invoice: {
        ...invoiceData,
        items,
        amount: subtotal,
        tax,
        total: totalAmount,
        currency: invoiceData.currency || "",
      },
      company,
    };

    const html = await ejs.renderFile(EJS_TEMPLATE_PATH, dataForTemplate);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error rendering invoice:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send(`Rendering failed: ${error.message}`);
  }
});

module.exports = router;
