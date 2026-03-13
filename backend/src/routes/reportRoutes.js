const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
// Suppression des routes Word

// RAPPORTS
router.get('/daily', protect, reportController.getDailyReport);
router.get('/monthly', protect, reportController.getMonthlyReport);
router.get('/annual', protect, reportController.getAnnualReport);

// SUMMARY
router.get('/summary', protect, reportController.getDailySummary);
router.get('/weeklysummary', protect, reportController.getWeeklySummary);

// GRAPHIQUES
router.get('/graph/daily', protect, reportController.getDailyGraphData);
router.get('/graph/monthly', protect, reportController.getMonthlyGraphData);
router.get('/graph/annual', protect, reportController.getAnnualGraphData);

// EXPORTS PDF
router.get('/export/daily', protect, reportController.exportDailyPDF);
router.get('/export/weekly', protect, reportController.exportWeeklyPDF);
router.get('/export/monthly', protect, reportController.exportMonthlyPDF);
router.get('/export/annual', protect, reportController.exportAnnualPDF);

// EXPORT EXCEL
router.get('/export/excel', protect, reportController.exportExcel);

// RECEIPT
router.get('/receipt/:stayId', protect, reportController.generateReceipt);

module.exports = router;
