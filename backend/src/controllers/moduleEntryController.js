const ModuleEntry = require('../models/ModuleEntry');

// GET /api/module-entries?module=restaurant|nightclub&date=2026-05-31&page=1&limit=20
exports.getEntries = async (req, res) => {
  try {
    const { module, date, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (module) filter.module = module;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      ModuleEntry.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      ModuleEntry.countDocuments(filter),
    ]);

    res.json({ entries, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur.' });
  }
};

// POST /api/module-entries
exports.createEntry = async (req, res) => {
  try {
    const { module, type, description, amount, date } = req.body;

    if (!module || !type || !description || amount === undefined) {
      return res.status(400).json({ msg: 'Champs requis manquants.' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ msg: 'Le montant doit être un nombre positif.' });
    }

    const entry = await ModuleEntry.create({
      module,
      type,
      description: description.trim(),
      amount: parsedAmount,
      date: date || Date.now(),
      createdBy: req.user.id,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur.' });
  }
};

// DELETE /api/module-entries/:id  (auteur ou admin)
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await ModuleEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ msg: 'Entrée introuvable.' });

    const isOwner = String(entry.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Non autorisé.' });
    }

    await entry.deleteOne();
    res.json({ msg: 'Supprimé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur.' });
  }
};
