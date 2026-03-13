// backend/src/models/DailyEntry.js
const mongoose = require('mongoose');

const dailyEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },

    // Phase obligatoire (1 = 8h-18h, 2 = 18h-8h)
    phase: { type: String, enum: ["day", "night"], required: true },

    // Totaux globaux
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },

    // Séjours liés à cette entrée 
    stays: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
        checkIn: { type: Date },
        checkOut: { type: Date },
        amount: { type: Number, default: 0 },
      },
    ],

    // Dépenses liées à la journée/nuit
    expenses: [
      {
        description: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],

    // Notes libres (optionnel)
    notes: { type: String, trim: true },

    // Utilisateur qui a créé l’entrée
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyEntry', dailyEntrySchema);
