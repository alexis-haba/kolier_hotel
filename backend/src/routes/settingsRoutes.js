const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/settingsController');

router.get('/',   protect, ctrl.getSettings);
router.patch('/', protect, role(['admin']), ctrl.updateSettings);

module.exports = router;
