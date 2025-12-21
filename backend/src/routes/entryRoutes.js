const express = require('express');
const router = express.Router();
const {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry
} = require('../controllers/entryController');
const { protect } = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// ================== CRÉER UNE ENTRÉE ==================
router.post('/', protect, role(['employee', 'admin']), createEntry);

// ================== RÉCUPÉRER TOUTES LES ENTRÉES ==================
router.get('/', protect, role(['employee', 'admin']), getEntries);

// ================== RÉCUPÉRER UNE ENTRÉE PAR ID ==================
router.get('/:id', protect, role(['admin']), getEntryById);

// ================== MODIFIER UNE ENTRÉE ==================
router.put('/:id', protect, role(['admin']), updateEntry);

// ================== SUPPRIMER UNE ENTRÉE ==================
router.delete('/:id', protect, role(['admin']), deleteEntry);

module.exports = router;
