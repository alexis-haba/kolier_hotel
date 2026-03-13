const DailyEntry = require('../models/DailyEntry');
const Stay = require('../models/Stay');
const AuditLog = require('../models/AuditLog'); // journalisation (optionnelle mais utile)

// 📌 Créer une nouvelle entrée
exports.createEntry = async (req, res) => {
  try {
    const { phase, stays = [], expenses = [], notes, totalIncome } = req.body;

    // Vérifier la phase (obligatoire)
    if (!phase || !["day", "night"].includes(phase)) {
      return res.status(400).json({ message: "Le champ 'phase' est requis et doit être 'day' ou 'night'." });
    }

    // Calcul automatique des totaux
    let calculatedIncome;
    if (phase === "day") {
      calculatedIncome = Number(totalIncome) || 0;
    } else {
      // On suppose que stays = tableau d’IDs de séjours (réels)
      const linkedStays = await Stay.find({ _id: { $in: stays } });
      calculatedIncome = linkedStays.reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const entry = await DailyEntry.create({
      phase,
      stays: phase === "night" ? stays : [], // on stocke les IDs des séjours uniquement la nuit
      expenses,
      notes,
      totalIncome: calculatedIncome,
      totalExpenses,
      createdBy: req.user?.id || null,
    });

    // Audit log
    await AuditLog.create({
      action: "create_entry",
      userId: req.user?.id,
      details: { entryId: entry._id, phase, totalIncome: calculatedIncome },
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la création",
      error: err.message,
    });
  }
};

// 📌 Récupérer toutes les entrées (journée + nuit)
exports.getEntries = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const entries = await DailyEntry.find(filter)
      .populate('stays')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 });

    const totalIncome = entries.reduce((sum, e) => sum + (e.totalIncome || 0), 0);
    const totalExpenses = entries.reduce((sum, e) => sum + (e.totalExpenses || 0), 0);
    const balance = totalIncome - totalExpenses;

    res.json({ entries, balance });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: err.message });
  }
};

// 📌 Récupérer une entrée par ID
exports.getEntryById = async (req, res) => {
  try {
    const entry = await DailyEntry.findById(req.params.id)
      .populate('stays')
      .populate('createdBy', 'username role');

    if (!entry) {
      return res.status(404).json({ message: 'Entrée non trouvée' });
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: err.message });
  }
};

// 📌 Modifier une entrée
exports.updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { phase, stays, expenses, notes, totalIncome } = req.body;

    const entry = await DailyEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Entrée non trouvée' });
    }

    // Mise à jour des champs fournis
    if (phase) entry.phase = phase;
    if (notes !== undefined) entry.notes = notes;
    if (stays !== undefined) entry.stays = stays;
    if (expenses !== undefined) entry.expenses = expenses;

    // Recalcul automatique des totaux
    let calculatedIncome = totalIncome;
    if (entry.phase === "night" && stays?.length) {
      const linkedStays = await Stay.find({ _id: { $in: stays } });
      calculatedIncome = linkedStays.reduce((sum, s) => sum + (s.amount || 0), 0);
    }
    entry.totalIncome = Number(calculatedIncome) || 0;
    entry.totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    await entry.save();

    // Audit log
    await AuditLog.create({
      action: "update_entry",
      userId: req.user?.id,
      details: { entryId: entry._id, phase: entry.phase },
    });

    res.json({ message: 'Entrée mise à jour', entry });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: err.message });
  }
};

// 📌 Supprimer une entrée
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await DailyEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entrée non trouvée' });
    }

    // Audit log
    await AuditLog.create({
      action: "delete_entry",
      userId: req.user?.id,
      details: { entryId: entry._id },
    });

    res.json({ message: 'Entrée supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
};
