const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const numberToWords = require("number-to-words");

const router = express.Router();

router.use(
  cors({
    origin: "http://localhost:5000",
  })
);

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const parseNumber = (val) => {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(num) ? 0 : num;
};

const normalizeKeys = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key.trim().toLowerCase()] = obj[key];
    }
  }
  return newObj;
};

function convertToINRWords(amount) {
  if (!amount || isNaN(amount)) return "Zero";
  const integer = Math.floor(amount);
  const fraction = Math.round((amount - integer) * 100);

  let words = numberToWords.toWords(integer);
  if (fraction > 0) {
    words += " and " + numberToWords.toWords(fraction) + " paise";
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function parseDate(dateVal) {
  if (dateVal instanceof Date) return dateVal.toISOString().split("T")[0];
  if (typeof dateVal === "string") {
    const parts = dateVal.split(/[-\/]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = "20" + y;
      return `${y.padStart(4, "20")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateVal;
  }
  return "";
}

// Load currencies with symbols from your JSON file
const currencySymbolMap = require("../config/currency.json");
const validCurrencies = Object.keys(currencySymbolMap);

router.post("/api/upload-excel", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file was uploaded." });
    }

    const workbook = xlsx.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    fs.unlinkSync(req.file.path);

    if (rawData.length === 0) {
      return res.status(400).json({ success: false, message: "The uploaded file is empty." });
    }

    const invoices = rawData
      .map(normalizeKeys)
      .map((row, i) => {
        const currencyRaw = (row["currency"] || "").toString().trim().toUpperCase();
        const currency = validCurrencies.includes(currencyRaw) ? currencyRaw : "INR";

        let totalAmount = 0;
        for (let idx = 1; idx <= 5; idx++) {
          const hours = parseNumber(row[`hours${idx}`]);
          const rate = parseNumber(row[`rate${idx}`]);
          totalAmount += hours * rate;
        }

        return {
          id: `inv-upload-${Date.now()}-${i}`,
          date: parseDate(row["date"]),
          name: row["name"] || "",
          email: row["email"] || "",
          phone: row["phone"] || "",
          currency,
          currencySymbol: currencySymbolMap[currency] || "",
          tax: parseNumber(row["tax"]),
          amount: totalAmount,
          total: totalAmount + parseNumber(row["tax"]),
          amountInWords: convertToINRWords(totalAmount + parseNumber(row["tax"])),
          description1: row["description1"] || "",
          hours1: parseNumber(row["hours1"]),
          rate1: parseNumber(row["rate1"]),
          description2: row["description2"] || "",
          hours2: parseNumber(row["hours2"]),
          rate2: parseNumber(row["rate2"]),
          description3: row["description3"] || "",
          hours3: parseNumber(row["hours3"]),
          rate3: parseNumber(row["rate3"]),
          description4: row["description4"] || "",
          hours4: parseNumber(row["hours4"]),
          rate4: parseNumber(row["rate4"]),
          description5: row["description5"] || "",
          hours5: parseNumber(row["hours5"]),
          rate5: parseNumber(row["rate5"]),
        };
      })
      .filter((inv) => inv.name || inv.email);

    return res.json({
      success: true,
      message: `${invoices.length} invoices processed successfully.`,
      invoices,
      currencies: [...new Set(invoices.map((inv) => inv.currency))],
      currencySymbolMap,
    });
  } catch (err) {
    console.error("Error processing file:", err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: "Server error processing file" });
  }
});

module.exports = router;
