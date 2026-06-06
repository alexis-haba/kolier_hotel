const mongoose = require('mongoose');

const moduleEntrySchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ['restaurant', 'nightclub'],
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amount:      { type: Number, required: true },
    date:        { type: Date, default: Date.now },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ModuleEntry', moduleEntrySchema);
