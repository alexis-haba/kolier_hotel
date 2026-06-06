const AppSettings = require('../models/AppSettings');

const getOrCreate = async () => {
  let settings = await AppSettings.findOne();
  if (!settings) settings = await AppSettings.create({});
  return settings;
};

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreate();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur.' });
  }
};

// PATCH /api/settings  (admin only)
exports.updateSettings = async (req, res) => {
  try {
    const { restaurantEnabled, nightclubEnabled } = req.body;
    const update = {};
    if (restaurantEnabled !== undefined) update.restaurantEnabled = Boolean(restaurantEnabled);
    if (nightclubEnabled  !== undefined) update.nightclubEnabled  = Boolean(nightclubEnabled);

    const settings = await AppSettings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur.' });
  }
};
