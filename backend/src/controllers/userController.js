const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Validation mot de passe complexe
function validatePassword(password) {
  // Minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// ------------------------- REGISTER -------------------------
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || typeof password !== 'string') {
      return res.status(400).json({ msg: 'Username et password requis, password doit être une chaîne.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ msg: 'Mot de passe trop faible. Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ msg: 'Utilisateur existe déjà' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, role });
    await user.save();

    res.status(201).json({ msg: 'Utilisateur enregistré' });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ------------------------- LOGIN -------------------------
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ msg: 'Champs requis' });

    // ⚠️ Important : récupérer le mot de passe même si select: false
    const user = await User.findOne({ username }).select('+password');
    if (!user) return res.status(401).json({ msg: 'Utilisateur introuvable' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, msg: 'Connexion réussie' });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ------------------------- GET USERS -------------------------
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // mot de passe jamais exposé
    res.json(users);
  } catch (err) {
    console.error('Erreur getUsers:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ------------------------- ADD USER -------------------------
exports.addUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ msg: 'Tous les champs sont requis' });

    if (!validatePassword(password)) {
      return res.status(400).json({ msg: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, role });
    await user.save();

    res.status(201).json({ msg: 'Utilisateur ajouté' });
  } catch (err) {
    console.error('Erreur addUser:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ------------------------- EDIT USER -------------------------
exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      if (!validatePassword(updates.password)) {
        return res.status(400).json({ msg: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (err) {
    console.error('Erreur editUser:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ------------------------- DELETE USER -------------------------
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    res.json({ msg: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};
