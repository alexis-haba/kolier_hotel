// models/Residence.js
const mongoose = require('mongoose');

const residenceSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
    link: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  { timestamps: true }
);

residenceSchema.index({ name: 1 });
residenceSchema.index({ link: 1 });

module.exports = mongoose.model('Residence', residenceSchema);
