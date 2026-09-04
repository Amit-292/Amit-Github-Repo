const twilio = require('twilio');

// Initialize Twilio client
// In production, use environment variables:
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// For demo/testing without Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'demo';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'demo';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

let twilioClient = null;

if (accountSid !== 'demo') {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send SMS with bill share link
 * @param {string} phoneNumber - Recipient phone number (format: +1234567890)
 * @param {string} sessionId - Bill session ID
 * @param {string} restaurantName - Restaurant name
 * @returns {Promise<{success: boolean, message: string, messageId?: string}>}
 */
async function sendBillShareSMS(phoneNumber, sessionId, restaurantName = 'A5 Confectioners') {
  try {
    // Validate phone number format
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return { success: false, message: 'Invalid phone number' };
    }

    // Ensure phone number has + prefix
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber;

    // Generate bill share link
    const billShareUrl = `${process.env.APP_URL || 'https://restaurant-billing-production-a629.up.railway.app'}/bill/${sessionId}`;

    // Create SMS message
    const message = `🍽️ Hi! Your bill from ${restaurantName} is ready.\n\nView & Download: ${billShareUrl}\n\nShare your bill and download PDF. Thank you for dining with us! 😊`;

    // If Twilio is configured, send actual SMS
    if (twilioClient && accountSid !== 'demo') {
      const result = await twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: formattedPhone,
      });

      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: result.sid,
      };
    }

    // Demo mode: return SMS text for manual sending
    console.log(`[SMS Demo Mode] Would send SMS to ${formattedPhone}:\n${message}`);

    return {
      success: true,
      isDemo: true,
      message: '📱 SMS Ready to Copy & Send Manually',
      phoneNumber: formattedPhone,
      billLink: billShareUrl,
      smsText: message,
      fullMessage: `
📱 SMS READY TO SEND

To: ${formattedPhone}
Message:
${message}

---
Note: Twilio not configured for automatic sending.
To enable automatic SMS on Railway, set these env variables:
• TWILIO_ACCOUNT_SID
• TWILIO_AUTH_TOKEN  
• TWILIO_PHONE_NUMBER

Then restart the app.
      `.trim()
    };
  } catch (error) {
    console.error('SMS send failed:', error.message);
    return {
      success: false,
      message: `SMS service error: ${error.message}`,
    };
  }
}

/**
 * Generate SMS text with bill link (for manual sending)
 * @param {string} sessionId - Bill session ID
 * @param {string} restaurantName - Restaurant name
 * @returns {string} SMS text ready to send
 */
function generateBillSMSText(sessionId, restaurantName = 'A5 Confectioners') {
  const billShareUrl = `${process.env.APP_URL || 'https://restaurant-billing-production-a629.up.railway.app'}/bill/${sessionId}`;
  return `🍽️ Hi! Your bill from ${restaurantName} is ready.\n\nView & Download: ${billShareUrl}\n\nShare your bill and download PDF. Thank you for dining with us! 😊`;
}

module.exports = {
  sendBillShareSMS,
  generateBillSMSText,
};
