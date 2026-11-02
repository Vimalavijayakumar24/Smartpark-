const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleTa: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    messageTa: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'danger'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['booking', 'payment', 'gate', 'timer', 'system', 'cancellation'],
      default: 'system',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
