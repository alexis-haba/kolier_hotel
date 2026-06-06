const express = require('express');
const router = express.Router();
const residenceController = require('../controllers/residenceController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/',                      protect, residenceController.addResidence);
router.get('/',                       protect, residenceController.getResidences);
router.get('/redirect-after-login',   protect, residenceController.redirectAfterLogin);
router.put('/:id',                    protect, residenceController.updateResidence);
router.delete('/:id',                 protect, residenceController.deleteResidence);

module.exports = router;
