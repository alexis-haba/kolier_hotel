const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/moduleEntryController');

router.get('/',        protect, ctrl.getEntries);
router.post('/',       protect, ctrl.createEntry);
router.delete('/:id',  protect, ctrl.deleteEntry);

module.exports = router;
