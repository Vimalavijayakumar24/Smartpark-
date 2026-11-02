const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parkingLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: true,
    },
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
    },
    slotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    rfid: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    durationHours: {
      type: Number,
      required: true,
      min: [1, 'Minimum booking duration is 1 hour'],
    },
    expectedEndTime: {
      type: Date,
      required: true,
    },
    ratePerHour: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'confirmed',
        'active',
        'completed',
        'cancelled',
        'cancelled_late_arrival',
      ],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'refunded'],
      default: 'paid',
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    departedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    lateReminderSent: {
      type: Boolean,
      default: false,
    },
    warning10MinSent: {
      type: Boolean,
      default: false,
    },
    expiryNoticeSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ parkingLocation: 1, slotNumber: 1, startTime: 1, expectedEndTime: 1 });
bookingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
