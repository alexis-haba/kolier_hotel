const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.post('/', protect, role(['admin', 'employee']), expenseController.addExpense);
router.get('/', protect, role(['admin', 'employee']), expenseController.getExpenses);

//  Route suppression
router.delete('/:id', protect, role(['admin']), expenseController.deleteExpense);

// Route mise à jour (admin seulement)
router.put('/:id', protect, role(['admin']), expenseController.updateExpense);

module.exports = router;
