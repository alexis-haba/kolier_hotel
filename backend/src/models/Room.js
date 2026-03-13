const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  state: { 
    type: String, 
    enum: ['free', 'occupied', 'cleaning'], // cohérent avec ton front
    default: 'free' 
  }
});

module.exports = mongoose.model('Room', roomSchema);
