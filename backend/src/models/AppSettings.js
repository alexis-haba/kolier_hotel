const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    restaurantEnabled:  { type: Boolean, default: false },
    nightclubEnabled:   { type: Boolean, default: false },
    conferenceEnabled:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
