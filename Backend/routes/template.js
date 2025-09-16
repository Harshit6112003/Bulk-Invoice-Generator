const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const TEMPLATE_PATH = path.join(__dirname, "../data/template.json");

router.post("/api/save-template", (req, res) => {
  try {
    const dir = path.dirname(TEMPLATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TEMPLATE_PATH, JSON.stringify(req.body, null, 2));
    res.json({ message: "Template saved" });
  } catch (error) {
    console.error("Error saving template:", error);
    res.status(500).json({ error: "Error saving template" });
  }
});

router.get("/api/load-template", (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(404).json({ error: "No template saved yet" });
    }
    const data = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    const template = JSON.parse(data);
    res.json(template);
  } catch (error) {
    console.error("Error loading template:", error);
    res.status(500).json({ error: "Error loading template" });
  }
});

module.exports = router;
