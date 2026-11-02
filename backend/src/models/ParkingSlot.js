const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
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
    floor: {
      type: String,
      default: 'Level 1',
    },
    type: {
      type: String,
      enum: ['standard', 'ev', 'accessible'],
      default: 'standard',
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'maintenance'],
      default: 'available',
    },
    sensorStatus: {
      type: String,
      enum: ['online', 'offline', 'triggered', 'idle'],
      default: 'online',
    },
    sensorLastUpdated: {
      type: Date,
      default: Date.now,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique slot numbers per parking location
parkingSlotSchema.index({ parkingLocation: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
