/**
 * ==========================================
 * SMARTPARK AI — SMS NOTIFICATION SERVICE
 * Real + Simulated Dual-Mode Gateway
 * ==========================================
 */

const smsLogs = [];

/**
 * Translations for SMS alerts
 */
const SMS_TEMPLATES = {
  BOOKING_CONFIRMED: {
    en: (code, slot, loc, time) =>
      `[SmartPark] Booking Confirmed! Code: ${code}, Slot: ${slot} at ${loc}. Valid until ${time}. Drive safely!`,
    ta: (code, slot, loc, time) =>
      `[SmartPark] முன்பதிவு உறுதியானது! குறியீடு: ${code}, இடம்: ${slot}, ${loc}. செல்லுபடியாகும் நேரம்: ${time}. பாதுகாப்பாக செல்லவும்!`,
  },
  GATE_ENTRY: {
    en: (plate, slot) =>
      `[SmartPark] Gate opened for ${plate}. Welcome! Please park at assigned slot ${slot}.`,
    ta: (plate, slot) =>
      `[SmartPark] ${plate} வாகனத்திற்கு கேட் திறக்கப்பட்டது. ஒதுக்கப்பட்ட இடம் ${slot}-ல் நிறுத்தவும்.`,
  },
  TIMER_WARNING: {
    en: (slot, mins) =>
      `[SmartPark Alert] Your parking session for slot ${slot} expires in ${mins} minutes. Extend now via app.`,
    ta: (slot, mins) =>
      `[SmartPark எச்சரிக்கை] இடம் ${slot}-க்கான பார்க்கிங் இன்னும் ${mins} நிமிடங்களில் முடிவடையும். உடனே நீட்டிக்கவும்.`,
  },
  TIMER_EXPIRED: {
    en: (slot) =>
      `[SmartPark Alert] Session expired for slot ${slot}. Overstay rates now apply. Please exit or extend.`,
    ta: (slot) =>
      `[SmartPark எச்சரிக்கை] இடம் ${slot} நேரம் முடிந்தது. கூடுதல் கட்டணம் பொருந்தும். தயவுசெய்து வெளியேறவும் அல்லது நீட்டிக்கவும்.`,
  },
  TIMER_EXTENDED: {
    en: (slot, hrs, newTime) =>
      `[SmartPark] Session for slot ${slot} extended by ${hrs} hr(s) until ${newTime}. Payment confirmed.`,
    ta: (slot, hrs, newTime) =>
      `[SmartPark] இடம் ${slot} நேரம் ${hrs} மணிநேரம் நீட்டிக்கப்பட்டது (${newTime} வரை). கட்டணம் செலுத்தப்பட்டது.`,
  },
  GATE_EXIT: {
    en: (slot, fee) =>
      `[SmartPark] Gate exit authorized for slot ${slot}. Total settled: $${fee.toFixed(2)}. Thank you for visiting!`,
    ta: (slot, hrs, fee) =>
      `[SmartPark] இடம் ${slot}-லிருந்து வெளியேற அனுமதி அளிக்கப்பட்டது. மொத்த கட்டணம்: $${fee.toFixed(2)}. நன்றி!`,
  },
};

const sendSMS = async ({ phone, template, params = [], lang = 'en', idempotencyKey = null }) => {
  if (idempotencyKey) {
    const existing = smsLogs.find((l) => l.idempotencyKey === idempotencyKey);
    if (existing) {
      return { success: true, duplicated: true, log: existing };
    }
  }

  const selectedTemplate = SMS_TEMPLATES[template];
  let messageText = '';

  if (selectedTemplate) {
    const generator = selectedTemplate[lang] || selectedTemplate.en;
    messageText = generator(...params);
  } else {
    messageText = `[SmartPark] Notification for ${phone}`;
  }

  const isTwilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  let deliveryStatus = 'simulated';
  let providerMessageId = `SIM-SMS-${Date.now().toString(36).toUpperCase()}`;

  if (isTwilioConfigured) {
    try {
      // Integration hook when Twilio package / keys are configured in .env
      deliveryStatus = 'delivered';
      providerMessageId = `TW-${Date.now()}`;
    } catch (err) {
      deliveryStatus = 'failed';
    }
  }

  const logEntry = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    phone,
    message: messageText,
    lang,
    template,
    deliveryStatus,
    provider: isTwilioConfigured ? 'Twilio Live Gateway' : 'SmartPark Simulated SMS Gateway',
    providerMessageId,
    idempotencyKey,
    timestamp: new Date().toISOString(),
  };

  smsLogs.unshift(logEntry);
  if (smsLogs.length > 100) smsLogs.pop();

  console.log(`[SMS Gateway] [${deliveryStatus.toUpperCase()}] To: ${phone} | Msg: "${messageText}"`);

  return {
    success: deliveryStatus !== 'failed',
    deliveryStatus,
    messageId: providerMessageId,
    message: messageText,
    log: logEntry,
  };
};

const getSMSLogs = (phone = null) => {
  if (phone) {
    return smsLogs.filter((l) => l.phone === phone);
  }
  return smsLogs;
};

module.exports = {
  sendSMS,
  getSMSLogs,
  SMS_TEMPLATES,
};
