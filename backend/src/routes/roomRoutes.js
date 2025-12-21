const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware'); // <-- destructurer ici
const role = require('../middlewares/roleMiddleware');

router.get('/', protect, roomController.getRooms);
router.post('/', protect, role(['admin']), roomController.addRoom);
router.put('/:id', protect, role(['employee','admin']), roomController.editRoom);
router.delete('/:id', protect, role(['admin']), roomController.deleteRoom);

module.exports = router;
