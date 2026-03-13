const Stay = require('../models/Stay');
const Expense = require('../models/Expense');
const Entry = require('../models/DailyEntry');
const getWorkdayRange = require('../utils/getWorkdayRange');

exports.getUserDailySummary = async (req, res) => {
  try {
    const { start, end } = getWorkdayRange();

    // 🔹 Séjours du jour
    const stays = await Stay.find({ startTime: { $gte: start, $lte: end } })
      .populate("roomId", "number")
      .lean();

    // --- Séparer les séjours par type ---
    const staysHour = stays.filter(s => s.phase === "hour");
    const staysDay = stays.filter(s => s.phase === "day");
    const staysNight = stays.filter(s => s.phase === "night");

    // --- Revenus par type ---
    const hourIncome = staysHour.reduce((sum, s) => sum + (s.amount || 0), 0);
    const dayIncome = staysDay.reduce((sum, s) => sum + (s.amount || 0), 0);
    const nightIncome = staysNight.reduce((sum, s) => sum + (s.amount || 0), 0);

    // --- Dépenses liées aux séjours ---
    const stayExpenses = stays.reduce(
      (sum, s) =>
        sum + (s.expenses || []).reduce((x, e) => x + (e.amount || 0), 0),
      0
    );

    // 🔹 Entrées caisse
    const entries = await Entry.find({ date: { $gte: start, $lte: end } }).lean();
    const entriesIncome = entries.reduce((sum, e) => sum + (e.totalIncome || 0), 0);
    const entriesExpenses = entries.reduce((sum, e) => sum + (e.totalExpenses || 0), 0);

    // 🔹 Dépenses directes
    const expensesList = await Expense.find({ date: { $gte: start, $lte: end } }).lean();
    const otherExpenses = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    // --- Totaux ---
    const totalIncome = hourIncome + dayIncome + nightIncome + entriesIncome;
    const totalExpenses = stayExpenses + entriesExpenses + otherExpenses;
    const remaining = totalIncome - totalExpenses;

    // Réponse structurée
    res.json({
      range: { start, end },
      totals: {
        hourIncome,
        dayIncome,
        nightIncome,
        entriesIncome,
        totalIncome,
        totalExpenses,
        remaining,
      },
      stays: {
        hours: staysHour,
        days: staysDay,
        nights: staysNight,
      },
      expenses: {
        stayExpenses,
        entriesExpenses,
        otherExpenses,
        list: expensesList,
      },
      entriesToday: entries,
    });
  } catch (err) {
    console.error("getUserDailySummary error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};
