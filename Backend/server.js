const express = require("express");
const cors = require("cors");
const path = require("path");
require('dotenv').config();
const bodyParser = require('body-parser');

const notificationRoutes = require("./routes/notifications");
const uploadRoutes = require("./routes/upload");
const sendRoutes = require("./routes/send");
const invoiceRoutes = require("./routes/invoice");
const templateRoutes = require("./routes/template");
const emailConfigRoute = require("./routes/emailConfig");
// ... other route imports

const app = express();
const PORT = process.env.PORT || 3000;

// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Debug ALL requests (put this FIRST)
app.use((req, res, next) => {
  if (req.url !== '/favicon.ico') {
    console.log(`📨 ${req.method} ${req.url} - Time: ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// Middleware (BEFORE routes)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ extended: true, limit: "1000mb" }));
app.use(bodyParser.json());

// Static files
app.use("/public", express.static(path.resolve(__dirname, "public")));

// Routes
console.log('🚀 Registering routes...');
app.use(notificationRoutes)
app.use(invoiceRoutes)
app.use(sendRoutes)
app.use(uploadRoutes)
app.use(templateRoutes); // Your notifications route
app.use(emailConfigRoute);
// ... other routes

// Test route
app.get('/api/server-test', (req, res) => {
  res.json({ success: true, message: 'Server is working!', timestamp: new Date() });
});

// 404 handler (LAST)
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: "Route Not Found",
    method: req.method,
    path: req.url
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/server-test`);
  console.log(`   GET  http://localhost:${PORT}/api/notifications-test`);
  console.log(`   POST http://localhost:${PORT}/api/send-notifications`);
});
