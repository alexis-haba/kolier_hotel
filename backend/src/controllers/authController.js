const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || typeof password !== 'string') {
    return res.status(400).json({ msg: 'Username et password requis, password doit être une chaîne.' });
  }
  if (await User.findOne({ username })) return res.status(400).json({ msg: 'Utilisateur existe déjà' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed, role });
  await user.save();
  res.status(201).json({ msg: 'Utilisateur enregistré' });
};

exports.me = async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    });
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "Champs requis" });
    }

    // ⚠️ select('+password') est obligatoire ici
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      console.log("Utilisateur introuvable:", username);
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Mot de passe incorrect pour:", username);
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};



