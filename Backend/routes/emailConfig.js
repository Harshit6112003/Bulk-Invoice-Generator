const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const router = express.Router();
const envFilePath = path.resolve(__dirname, '../.env');

// Function to reload .env variables after update
function reloadEnv() {
  dotenv.config({ path: envFilePath, override: true });
}

// GET: Check if email config exists and is valid
router.get('/api/email-config-status', async (req, res) => {
  try {
    const content = await fs.readFile(envFilePath, 'utf8');
    const emailLine = content.split('\n').find(line => line.startsWith('EMAIL_ID='));
    const passLine = content.split('\n').find(line => line.startsWith('EMAIL_PASS='));

    if (!emailLine || !passLine) {
      return res.json({ configured: false });
    }

    const email = emailLine.split('=')[1]?.trim();
    const password = passLine.split('=')[1]?.trim();

    if (!email || !password) {
      return res.json({ configured: false });
    }

    // Try SMTP connection verification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password,
      },
    });

    transporter.verify((err) => {
      if (err) {
        console.error('SMTP verification error:', err);
        return res.json({ configured: false });
      } else {
        return res.json({ configured: true });
      }
    });
  } catch (err) {
    console.error('Error in email-config-status:', err);
    return res.json({ configured: false });
  }
});

// POST: Save email config to .env
router.post('/api/save-config', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let content = '';
    try {
      content = await fs.readFile(envFilePath, 'utf8');
    } catch {
      // File may not exist on first run
      console.log("No existing .env file found, will create new one.");
      content = '';
    }

    // Remove any existing EMAIL_ID/EMAIL_PASS lines
    const lines = content
      .split('\n')
      .filter(line => line.trim() !== '' && !line.startsWith('EMAIL_ID=') && !line.startsWith('EMAIL_PASS='));

    // Add new lines
    lines.push(`EMAIL_ID=${email}`);
    lines.push(`EMAIL_PASS=${password}`);

    await fs.writeFile(envFilePath, lines.join('\n') + '\n', { encoding: 'utf8' });

    // Reload environment variables to update process.env dynamically
    reloadEnv();

    console.log('✅ Email credentials saved to .env and environment reloaded');
    res.json({ message: 'Configuration saved and environment reloaded' });
  } catch (error) {
    console.error('Failed to save email configuration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
