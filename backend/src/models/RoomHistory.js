const mongoose = require('mongoose');

const roomHistorySchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  oldState: { type: String, enum: ['free', 'occupied', 'cleaning'], required: true },
  newState: { type: String, enum: ['free', 'occupied', 'cleaning'], required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optionnel
});

module.exports = mongoose.model('RoomHistory', roomHistorySchema);