// routes/residenceRoutes.js
const express = require('express');
const router = express.Router();
const residenceController = require('../controllers/residenceController');
const { protect } = require('../middlewares/authMiddleware');

// Ajouter une résidence (POST /api/residences)
router.post('/', protect, residenceController.addResidence);

// Lister toutes les résidences (GET /api/residences)
router.get('/', protect, residenceController.getResidences);

// Redirection après login
router.get('/redirect-after-login', protect, residenceController.redirectAfterLogin);

// Modifier une résidence (PUT)
router.put('/:id', protect, residenceController.updateResidence);

// Supprimer une résidence (DELETE)
router.delete('/:id', protect, residenceController.deleteResidence);


module.exports = router;
