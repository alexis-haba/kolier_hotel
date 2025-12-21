// backend/src/controllers/ExpenseController.js
const Expense = require('../models/Expense');
const AuditLog = require('../models/AuditLog');
const getWorkdayRange = require('../utils/getWorkdayRange');


exports.addExpense = async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: "Aucune dépense reçue" });
    }

    const saved = [];
    for (const exp of expenses) {
      const expense = new Expense({
        description: exp.description,
        amount: exp.amount,
        date: new Date(),
        includeInDailyTotal:
          exp.includeInDailyTotal !== undefined
            ? exp.includeInDailyTotal
            : true, // ✅ valeur par défaut
      });
      await expense.save();
      saved.push(expense);

      await new AuditLog({
        action: "add_expense",
        userId: req.user.id,
        details: { expenseId: expense._id },
      }).save();
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("Erreur addExpense:", err);
    res.status(500).json({ message: "Erreur lors de l’enregistrement" });
  }
};



exports.getExpenses = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};

    if (date) {
      const { start, end } = getWorkdayRange(new Date(date));
      filter.date = { $gte: start, $lt: end };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Erreur getExpenses:", err);
    res.status(500).json({ message: "Erreur lors de la récupération des dépenses" });
  }
};


exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Dépense non trouvée" });
    }

    await expense.deleteOne();

    // ✅ Enregistrer l’action dans l’audit log
    await new AuditLog({
      action: "delete_expense",
      userId: req.user.id,
      details: { expenseId: id, description: expense.description },
    }).save();

    res.status(200).json({ message: "Dépense supprimée avec succès" });
  } catch (err) {
    console.error("Erreur deleteExpense:", err);
    res.status(500).json({ message: "Erreur lors de la suppression de la dépense" });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Dépense non trouvée" });
    }

    // Mettre à jour uniquement les champs transmis
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;

    await expense.save();

    // ✅ Audit log
    await new AuditLog({
      action: "update_expense",
      userId: req.user.id,
      details: { expenseId: id, description, amount },
    }).save();

    res.status(200).json({ message: "Dépense mise à jour avec succès", expense });
  } catch (err) {
    console.error("Erreur updateExpense:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la dépense" });
  }
};
