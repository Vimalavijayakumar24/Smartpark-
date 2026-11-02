const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema(
  {
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    parkingLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: true,
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
    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    initialFee: {
      type: Number,
      default: 0,
    },
    overstayMinutes: {
      type: Number,
      default: 0,
    },
    overstayFee: {
      type: Number,
      default: 0,
    },
    totalFee: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending_overstay', 'completed', 'waived'],
      default: 'paid',
    },
    gateEntryAuthorized: {
      type: Boolean,
      default: true,
    },
    gateExitAuthorized: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'disputed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

parkingSessionSchema.index({ vehicleNumber: 1, status: 1 });
parkingSessionSchema.index({ rfid: 1, status: 1 });

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
