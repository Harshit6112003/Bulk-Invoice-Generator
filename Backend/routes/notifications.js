const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/emailSender');
const sendWhatsApp = require('../utils/whatsappSender');

// Add logging to verify route is loaded
console.log('📝 Notifications route loaded');

// Test route
router.get('/api/notifications-test', (req, res) => {
  console.log('✅ Notifications test route hit');
  res.json({ success: true, message: 'Notifications route is working!' });
});

// Your existing code for email and WhatsApp generation
const generateNotificationEmail = (user) => {
  const statusColor = user.paymentStatus === 'Partially Paid' ? '#ffc107' : '#dc3545';
  const statusBg = user.paymentStatus === 'Partially Paid' ? '#fff3cd' : '#f8d7da';
  const statusTextColor = user.paymentStatus === 'Partially Paid' ? '#856404' : '#721c24';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #007bff; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 15px;">
          🔔 Payment Reminder
        </h1>
        
        <div style="background-color: white; padding: 25px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${user.name}</strong>,</p>
          
          <p style="margin-bottom: 20px;">We hope this message finds you well. This is a friendly reminder regarding your payment status.</p>
          
          <div style="background-color: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: ${statusTextColor};">
              ⚠️ Current Status: ${user.paymentStatus}
            </h3>
            <p style="margin-bottom: 0; color: ${statusTextColor}; font-size: 14px;">
              ${user.paymentStatus === 'Partially Paid' 
                ? 'You have a partial payment pending. Please complete your payment to avoid any service interruption.' 
                : 'Your payment is currently unpaid. Please make the payment at your earliest convenience.'}
            </p>
          </div>

          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h4 style="margin-top: 0; color: #1976d2;">📞 Contact Information</h4>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Phone:</strong> ${user.phone}</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> ${user.email}</p>
          </div>

          <p style="margin-top: 25px;">If you have already made the payment, please disregard this message. If you have any questions, please contact our support team.</p>
          <p style="margin-bottom: 0;">Thank you for your prompt attention! 🙏</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This is an automated message from Your Company. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateWhatsAppMessage = (user) => {
  const statusEmoji = user.paymentStatus === 'Partially Paid' ? '⚠️' : '🚨';
  
  return `
${statusEmoji} *PAYMENT REMINDER* ${statusEmoji}

Hello *${user.name}*,

Your payment status: *${user.paymentStatus}*

${user.paymentStatus === 'Partially Paid' 
  ? '💰 You have a partial payment pending. Please complete your payment to avoid service interruption.' 
  : '💳 Your payment is currently unpaid. Please make the payment at your earliest convenience.'}

📞 Phone: ${user.phone}
📧 Email: ${user.email}

If you have any questions, please contact our support team.

Thank you! 🙏

---
*This is an automated message from Your Company*
  `.trim();
};

router.post('/api/send-notifications', async (req, res) => {
  console.log('🎯 POST /api/send-notifications route hit!');
  console.log('Request body:', req.body);

  try {
    const { users, channels } = req.body;

    // Validation
    if (!users || !Array.isArray(users) || users.length === 0) {
      console.log('❌ Validation failed: No users provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No users provided' 
      });
    }

    if (!channels || (!channels.email && !channels.whatsapp)) {
      console.log('❌ Validation failed: No channels selected');
      return res.status(400).json({ 
        success: false, 
        error: 'At least one channel must be selected' 
      });
    }

    console.log(`📤 Processing notifications for ${users.length} users...`);
    
    const results = [];
    let emailSuccess = 0;
    let whatsappSuccess = 0;
    let totalErrors = 0;

    for (const user of users) {
      const result = { 
        id: user.id, 
        name: user.name, 
        channels: {} 
      };

      // Send Email Notification
      if (channels.email && user.email) {
        try {
          const emailSubject = `Payment Reminder - ${user.paymentStatus} Status`;
          const emailHtml = generateNotificationEmail(user);

          await sendEmail(user.email, emailSubject, null, null, emailHtml);
          
          result.channels.email = { 
            status: 'sent', 
            message: 'Email sent successfully' 
          };
          emailSuccess++;
          console.log(`✅ Email sent to ${user.name} (${user.email})`);
        } catch (emailError) {
          console.error(`❌ Email failed for ${user.email}:`, emailError.message);
          result.channels.email = { 
            status: 'failed', 
            error: emailError.message 
          };
          totalErrors++;
        }
      }

      // Send WhatsApp Notification
      if (channels.whatsapp && user.phone) {
        try {
          const whatsappMessage = generateWhatsAppMessage(user);
          await sendWhatsApp(user.phone, whatsappMessage);
          
          result.channels.whatsapp = { 
            status: 'sent', 
            message: 'WhatsApp sent successfully' 
          };
          whatsappSuccess++;
          console.log(`✅ WhatsApp sent to ${user.name} (${user.phone})`);
        } catch (whatsappError) {
          console.error(`❌ WhatsApp failed for ${user.phone}:`, whatsappError.message);
          result.channels.whatsapp = { 
            status: 'failed', 
            error: whatsappError.message 
          };
          totalErrors++;
        }
      }

      results.push(result);
    }

    // Build success message
    const successMessages = [];
    if (emailSuccess > 0) successMessages.push(`${emailSuccess} emails`);
    if (whatsappSuccess > 0) successMessages.push(`${whatsappSuccess} WhatsApp messages`);

    const message = successMessages.length > 0 
      ? `Successfully sent ${successMessages.join(' and ')}`
      : 'No notifications were sent';

    console.log(`✅ Batch completed: ${message}${totalErrors > 0 ? ` (${totalErrors} errors)` : ''}`);

    res.json({
      success: true,
      message: message,
      summary: {
        total: users.length,
        emailSuccess,
        whatsappSuccess,
        errors: totalErrors
      },
      results: results
    });

  } catch (error) {
    console.error('❌ Error in send-notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// IMPORTANT: Must export the router
module.exports = router;
