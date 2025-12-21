// controllers/residenceController.js
const Residence = require('../models/Residence');

// Ajouter une nouvelle résidence
exports.addResidence = async (req, res) => {
  try {
    const { name, link } = req.body;

    // Vérifier doublons
    const existName = await Residence.findOne({ name });
    const existLink = await Residence.findOne({ link });

    if (existName) return res.status(400).json({ message: "Une résidence avec ce nom existe déjà." });
    if (existLink) return res.status(400).json({ message: "Le lien est déjà utilisé." });

    const newResidence = await Residence.create({
      name,
      link,
      createdBy: req.user.id   // <-- CORRECTION ICI
    });

    return res.json({
      message: "Résidence ajoutée avec succès.",
      residence: newResidence
    });
  } catch (error) {
    console.error("Erreur addResidence :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Lister toutes les résidences
exports.getResidences = async (req, res) => {
  try {
    const residences = await Residence.find();
    res.json(residences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Redirection après login
exports.redirectAfterLogin = async (req, res) => {
  try {
    const residences = await Residence.find();
    if (residences.length === 0) {
      return res.json({ redirect: "/dashboard" });
    } else {
      return res.json({ redirect: "/residences" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Modifier une résidence
exports.updateResidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link } = req.body;

    // Vérifier doublons sauf pour la résidence actuelle
    const existName = await Residence.findOne({ name, _id: { $ne: id } });
    const existLink = await Residence.findOne({ link, _id: { $ne: id } });
    if (existName) return res.status(400).json({ message: "Nom déjà utilisé." });
    if (existLink) return res.status(400).json({ message: "Lien déjà utilisé." });

    const updated = await Residence.findByIdAndUpdate(id, { name, link }, { new: true });
    if (!updated) return res.status(404).json({ message: "Résidence non trouvée." });

    res.json({ message: "Résidence mise à jour.", residence: updated });
  } catch (error) {
    console.error("Erreur updateResidence:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Supprimer une résidence
exports.deleteResidence = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Residence.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Résidence non trouvée." });
    res.json({ message: "Résidence supprimée." });
  } catch (error) {
    console.error("Erreur deleteResidence:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
