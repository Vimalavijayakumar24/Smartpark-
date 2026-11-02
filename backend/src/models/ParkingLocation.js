const mongoose = require('mongoose');

const parkingLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      default: 'Metropolis',
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        default: 11.0168,
      },
      lng: {
        type: Number,
        required: true,
        default: 76.9558,
      },
    },
    totalSlots: {
      type: Number,
      required: true,
      default: 40,
    },
    availableSlots: {
      type: Number,
      required: true,
      default: 40,
    },
    ratePerHour: {
      type: Number,
      required: true,
      default: 5.0,
    },
    supportedVehicles: {
      type: [String],
      default: ['Car', 'EV', 'SUV'],
    },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Full'],
      default: 'Active',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ParkingLocation', parkingLocationSchema);
