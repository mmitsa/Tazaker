const twilio = require('twilio');
const axios = require('axios');
const logger = require('../utils/logger');

// SMS configuration
const smsConfig = {
  provider: process.env.SMS_PROVIDER || 'twilio', // 'twilio' or 'mobily'
  enabled: process.env.ENABLE_SMS === 'true',

  // Twilio configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Mobily configuration
  mobily: {
    username: process.env.MOBILY_USERNAME,
    password: process.env.MOBILY_PASSWORD,
    sender: process.env.MOBILY_SENDER || 'HOSPITAL',
    apiUrl: 'https://api.mobily.ws/api/msgSend.php',
  },
};

// Initialize Twilio client
let twilioClient = null;
if (smsConfig.provider === 'twilio' && smsConfig.twilio.accountSid) {
  twilioClient = twilio(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
}

/**
 * Send SMS using Twilio
 * @param {string} to - Phone number (E.164 format)
 * @param {string} message - Message content
 * @returns {Promise<Object>} Send result
 */
const sendTwilioSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: smsConfig.twilio.phoneNumber,
      to: to,
    });

    logger.info('Twilio SMS sent successfully', {
      to,
      sid: result.sid,
      status: result.status,
    });

    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    logger.error('Twilio SMS error:', error);
    return {
      success: false,
      provider: 'twilio',
      error: error.message,
    };
  }
};

/**
 * Send SMS using Mobily
 * @param {string} to - Phone number (Saudi format: 966XXXXXXXXX)
 * @param {string} message - Message content (Arabic supported)
 * @returns {Promise<Object>} Send result
 */
const sendMobilySMS = async (to, message) => {
  try {
    // Format phone number for Mobily (remove + and spaces)
    const formattedPhone = to.replace(/[\s\+]/g, '');

    const params = {
      mobile: formattedPhone,
      password: smsConfig.mobily.password,
      numbers: formattedPhone,
      sender: smsConfig.mobily.sender,
      msg: message,
      timeSend: 0,
      dateSend: 0,
      applicationType: 68, // Unicode for Arabic support
    };

    const response = await axios.get(smsConfig.mobily.apiUrl, { params });
    const responseCode = parseInt(response.data);

    // Mobily response codes
    const statusMap = {
      1: 'Success',
      2: 'Invalid credentials',
      3: 'Insufficient balance',
      4: 'Invalid sender name',
      5: 'Message is empty',
      6: 'Invalid numbers',
    };

    const success = responseCode === 1;
    const status = statusMap[responseCode] || 'Unknown error';

    if (success) {
      logger.info('Mobily SMS sent successfully', { to, status });
    } else {
      logger.error('Mobily SMS failed', { to, code: responseCode, status });
    }

    return {
      success,
      provider: 'mobily',
      messageId: Date.now().toString(),
      status,
      code: responseCode,
    };
  } catch (error) {
    logger.error('Mobily SMS error:', error);
    return {
      success: false,
      provider: 'mobily',
      error: error.message,
    };
  }
};

/**
 * Send SMS using configured provider
 * @param {string} to - Phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} Send result
 */
const sendSMS = async (to, message) => {
  // Check if SMS is enabled
  if (!smsConfig.enabled) {
    logger.warn('SMS sending is disabled');
    return {
      success: false,
      error: 'SMS sending is disabled',
    };
  }

  // Validate inputs
  if (!to || !message) {
    throw new Error('Phone number and message are required');
  }

  // Send based on provider
  if (smsConfig.provider === 'twilio') {
    return await sendTwilioSMS(to, message);
  } else if (smsConfig.provider === 'mobily') {
    return await sendMobilySMS(to, message);
  } else {
    throw new Error(`Unknown SMS provider: ${smsConfig.provider}`);
  }
};

/**
 * Format phone number to E.164 format (for Twilio)
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code (default: +966 for Saudi Arabia)
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone, countryCode = '+966') => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If number starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If number doesn't start with country code, add it
  if (!cleaned.startsWith('966')) {
    cleaned = countryCode.replace('+', '') + cleaned;
  }

  return '+' + cleaned;
};

/**
 * SMS message templates
 */
const messageTemplates = {
  ticketIssued: (ticketNumber, clinicName, queuePosition, estimatedTime) => {
    return `مرحباً، تم إصدار تذكرة رقم ${ticketNumber} لـ ${clinicName}. موقعك في القائمة: ${queuePosition}، الوقت المتوقع: ${estimatedTime} دقيقة.`;
  },

  ticketReminder: (ticketNumber, clinicName, remainingPatients) => {
    return `عزيزي المريض، سيحين دورك قريباً! تذكرة: ${ticketNumber}، العيادة: ${clinicName}، متبقي: ${remainingPatients} مرضى.`;
  },

  ticketCalled: (ticketNumber, clinicName) => {
    return `عزيزي المريض، حان دورك الآن! تذكرة: ${ticketNumber}. الرجاء التوجه إلى ${clinicName}.`;
  },

  appointmentConfirmation: (patientName, clinicName, date, time) => {
    return `مرحباً ${patientName}، تم تأكيد موعدك في ${clinicName} بتاريخ ${date} الساعة ${time}.`;
  },

  appointmentReminder: (patientName, clinicName, date, time) => {
    return `تذكير: لديك موعد في ${clinicName} غداً بتاريخ ${date} الساعة ${time}. نتطلع لرؤيتك.`;
  },
};

/**
 * Test SMS configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
const testSMSConfig = async () => {
  try {
    if (!smsConfig.enabled) {
      logger.warn('SMS is disabled');
      return false;
    }

    if (smsConfig.provider === 'twilio') {
      if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken) {
        logger.error('Twilio credentials missing');
        return false;
      }
      logger.info('Twilio SMS configuration is valid');
      return true;
    } else if (smsConfig.provider === 'mobily') {
      if (!smsConfig.mobily.username || !smsConfig.mobily.password) {
        logger.error('Mobily credentials missing');
        return false;
      }
      logger.info('Mobily SMS configuration is valid');
      return true;
    } else {
      logger.error('Unknown SMS provider');
      return false;
    }
  } catch (error) {
    logger.error('SMS configuration test failed:', error);
    return false;
  }
};

module.exports = {
  smsConfig,
  sendSMS,
  sendTwilioSMS,
  sendMobilySMS,
  formatPhoneNumber,
  messageTemplates,
  testSMSConfig,
};
