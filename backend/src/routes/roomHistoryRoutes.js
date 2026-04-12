const express = require('express');
const router = express.Router();
const RoomHistory = require('../models/RoomHistory');

// GET /api/room-history/:roomId
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const history = await RoomHistory.find({ roomId }).sort({ changedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
