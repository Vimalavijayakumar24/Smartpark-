const DataStore = require('./dataStore');
const { sendSMS } = require('./smsService');

let intervalId = null;

const checkBookingsAndTimers = async () => {
  try {
    const allBookings = await DataStore.getAllBookings();
    const now = Date.now();
    const graceMinutes = parseInt(process.env.LATE_ARRIVAL_GRACE_MINUTES || '30', 10);

    for (const booking of allBookings) {
      const startMs = new Date(booking.startTime).getTime();
      const endMs = new Date(booking.expectedEndTime).getTime();
      const remainingMinutes = Math.round((endMs - now) / 60000);

      // 1. Timer Expiry Warning (10 minutes before end time)
      if (
        booking.status === 'active' &&
        remainingMinutes > 0 &&
        remainingMinutes <= 10 &&
        !booking.warning10MinSent
      ) {
        await DataStore.updateBooking(booking._id || booking.id, { warning10MinSent: true });

        await DataStore.createNotification({
          user: booking.user?._id || booking.user?.id || booking.user,
          title: 'Timer Warning: 10 Minutes Remaining',
          titleTa: 'நேர எச்சரிக்கை: 10 நிமிடங்கள் மட்டுமே உள்ளன',
          message: `Your session for slot ${booking.slotNumber} will expire in 10 minutes. Extend now to prevent overstay charges.`,
          messageTa: `இடம் ${booking.slotNumber}-க்கான நேரம் இன்னும் 10 நிமிடங்களில் முடிவடையும். கூடுதல் கட்டணத்தை தவிர்க்க உடனே நீட்டிக்கவும்.`,
          type: 'warning',
          category: 'timer',
        });

        const userPhone = booking.user?.phone || '+1-555-0199';
        await sendSMS({
          phone: userPhone,
          template: 'TIMER_WARNING',
          params: [booking.slotNumber, 10],
          idempotencyKey: `sms_warn_${booking._id || booking.id}`,
        });
      }

      // 2. Timer Expired Notification
      if (
        booking.status === 'active' &&
        now >= endMs &&
        !booking.expiryNoticeSent
      ) {
        await DataStore.updateBooking(booking._id || booking.id, { expiryNoticeSent: true });

        // Note: Slot is NOT released here if vehicle is physically parked!
        // "A slot must not become available merely because its timer expires if a vehicle still occupies it."

        await DataStore.createNotification({
          user: booking.user?._id || booking.user?.id || booking.user,
          title: 'Parking Session Expired',
          titleTa: 'பார்க்கிங் அமர்வு முடிவடைந்தது',
          message: `Your booking duration for slot ${booking.slotNumber} has concluded. Please depart through the gate or extend immediately.`,
          messageTa: `இடம் ${booking.slotNumber}-க்கான நேரம் முடிந்தது. தயவுசெய்து வெளியேறவும் அல்லது நேரத்தை நீட்டிக்கவும்.`,
          type: 'danger',
          category: 'timer',
        });

        const userPhone = booking.user?.phone || '+1-555-0199';
        await sendSMS({
          phone: userPhone,
          template: 'TIMER_EXPIRED',
          params: [booking.slotNumber],
          idempotencyKey: `sms_exp_${booking._id || booking.id}`,
        });
      }

      // 3. Late Arrival check for confirmed bookings
      if (
        booking.status === 'confirmed' &&
        !booking.arrivedAt &&
        now > startMs + graceMinutes * 60000 &&
        !booking.lateReminderSent
      ) {
        await DataStore.updateBooking(booking._id || booking.id, { lateReminderSent: true });

        await DataStore.createNotification({
          user: booking.user?._id || booking.user?.id || booking.user,
          title: 'Late Arrival Notice',
          titleTa: 'தாமத வருகை அறிவிப்பு',
          message: `You have not checked in for slot ${booking.slotNumber} at ${booking.parkingLocation?.name || 'facility'}. Your slot remains reserved for your arrival.`,
          messageTa: `இடம் ${booking.slotNumber}-ல் நீங்கள் இன்னும் வரவில்லை. உங்கள் வருகைக்காக இடம் ஒதுக்கப்பட்டு காத்திருக்கிறது.`,
          type: 'info',
          category: 'booking',
        });
      }
    }
  } catch (err) {
    console.warn('[LateArrivalJob] Monitoring cycle error:', err.message);
  }
};

const startLateArrivalJob = () => {
  const intervalMs = parseInt(process.env.LATE_ARRIVAL_CHECK_INTERVAL_MS || '30000', 10);
  if (!intervalId) {
    intervalId = setInterval(checkBookingsAndTimers, intervalMs);
    console.log(`[Job] Late arrival & timer monitoring active (interval: ${intervalMs}ms)`);
  }
};

const stopLateArrivalJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Job] Late arrival monitoring stopped.');
  }
};

module.exports = {
  startLateArrivalJob,
  stopLateArrivalJob,
  checkBookingsAndTimers,
};
