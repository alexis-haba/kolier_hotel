// controllers/stayController.js
const Stay = require('../models/Stay');
const Room = require('../models/Room');
const Tariff = require('../models/Tariff');
const AuditLog = require('../models/AuditLog');

const getWorkdayRange = require('../utils/getWorkdayRange');


// 📌 Ajouter un séjour
exports.addStay = async (req, res) => {
  try {
    const { roomId, startTime, endTime, phase, paymentMethod, expenses, amount: sentAmount } = req.body;

    if (!roomId || !startTime || !endTime || !phase) {
      return res.status(400).json({ msg: 'Champs requis' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ msg: "Chambre introuvable" });
    if (room.state !== "free") return res.status(400).json({ msg: "Chambre non disponible" });

    const tariff = await Tariff.findOne();
    if (!tariff) return res.status(500).json({ msg: "Aucun tarif défini" });

    const hours = Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60));

    // ✅ Nouveau : on garde toujours le montant manuel
    let amount = Number(sentAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: "Montant invalide" });
    }

    const stay = new Stay({
      roomId,
      startTime,
      endTime,
      hours,
      phase,
      amount,
      paymentMethod,
      expenses,
      createdBy: req.user?.id
    });

    await stay.save();
    await Room.findByIdAndUpdate(roomId, { state: "occupied" });

    await new AuditLog({
      action: 'add_stay',
      userId: req.user.id,
      details: { stayId: stay._id, phase },
    }).save();

    res.status(201).json(stay);
  } catch (err) {
    console.error("Erreur addStay:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// 📌 Récupérer les séjours (avec filtres par date/chambre/phase)

// 📌 Modifier un séjour
exports.updateStay = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    const stay = await Stay.findById(id);
    if (!stay) return res.status(404).json({ msg: "Séjour introuvable" });

    if (amount !== undefined) stay.amount = amount;
    if (paymentMethod !== undefined) stay.paymentMethod = paymentMethod;

    await stay.save();

    await new AuditLog({
      action: "update_stay",
      userId: req.user.id,
      details: { stayId: id, amount, paymentMethod },
    }).save();

    res.json({ msg: "Séjour mis à jour", stay });
  } catch (err) {
    console.error("Erreur updateStay:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// 📌 Supprimer un séjour
exports.deleteStay = async (req, res) => {
  try {
    const { id } = req.params;
    const stay = await Stay.findByIdAndDelete(id);
    if (!stay) return res.status(404).json({ msg: "Séjour introuvable" });

    await new AuditLog({
      action: "delete_stay",
      userId: req.user.id,
      details: { stayId: id },
    }).save();

    res.json({ msg: "Séjour supprimé avec succès" });
  } catch (err) {
    console.error("Erreur deleteStay:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


exports.getStays = async (req, res) => {
  try {
    const { date, roomId, phase } = req.query;
    const filter = {};

    if (date) {
      const { start, end } = getWorkdayRange(new Date(date));
      filter.startTime = { $gte: start, $lt: end };
    }

    if (roomId) filter.roomId = roomId;
    if (phase) filter.phase = phase;

    const stays = await Stay.find(filter)
      .populate('roomId', 'number state')
      .populate('createdBy', 'username role')
      .sort({ startTime: -1 });

    res.json(stays);
  } catch (err) {
    console.error("Erreur GET /stays :", err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// 📌 Nouvel historique complet (sans limite de date)
exports.getHistory = async (req, res) => {
  try {
    const stays = await Stay.find()
      .populate('roomId', 'number state')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 }); // plus récents en premier

    res.json(stays);
  } catch (err) {
    console.error("Erreur GET /stays/history :", err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// 📌 Terminer un séjour
exports.endStay = async (req, res) => {
  try {
    const { id } = req.params;
    const stay = await Stay.findByIdAndUpdate(
      id,
      { endTime: new Date() },
      { new: true }
    );

    if (!stay) {
      return res.status(404).json({ msg: 'Séjour non trouvé' });
    }

    await Room.findByIdAndUpdate(stay.roomId, { state: "free" });

    await new AuditLog({
      action: 'end_stay',
      userId: req.user.id,
      details: { stayId: id },
    }).save();

    res.json(stay);
  } catch (err) {
    console.error("Erreur endStay:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};
