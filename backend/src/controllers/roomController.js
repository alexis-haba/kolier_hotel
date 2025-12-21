// controllers/roomController.js
const Room = require('../models/Room');
const Stay = require('../models/Stay');

// 📌 Récupérer toutes les chambres
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    console.error("Erreur getRooms:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// 📌 Ajouter une chambre
exports.addRoom = async (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Le numéro de chambre est requis" });
    }

    const room = await Room.create({ number, state: "free" });
    res.status(201).json(room);
  } catch (error) {
    console.error("Erreur addRoom:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Modifier une chambre
// 📌 Modifier une chambre
exports.editRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, type, state } = req.body;

    // Si on veut remettre la chambre en free, on vérifie les séjours
    if (state === "free") {
      const activeStay = await Stay.findOne({
        roomId: id,
        endTime: { $exists: false } // séjour pas encore terminé
      });

      if (activeStay) {
        return res.status(400).json({ msg: "Impossible de libérer la chambre : un séjour est encore en cours" });
      }
    }

    const updates = {};
    if (number) updates.number = number;
    if (type) updates.type = type;
    if (state) updates.state = state;

    const room = await Room.findByIdAndUpdate(id, updates, { new: true });
    if (!room) return res.status(404).json({ msg: 'Chambre non trouvée' });

    res.json(room);
  } catch (err) {
    console.error("Erreur editRoom:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


// 📌 Supprimer une chambre
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await Room.findByIdAndDelete(id);
    res.json({ msg: 'Chambre supprimée' });
  } catch (err) {
    console.error("Erreur deleteRoom:", err);
    res.status(500).json({ msg: "Erreur lors de la suppression de la chambre" });
  }
};
