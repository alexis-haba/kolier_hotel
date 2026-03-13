// backend/src/index.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const connectDB = require('./config/db');
const Tariff = require('./models/Tariff');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

/* ======================= 🔐 SECURITY & CORS ======================= */
app.use(helmet());

// CORS MOBILE + WEB
app.use(
  cors({
    origin: true, // accepte mobile, web, build
    credentials: true,
  })
);

app.use(xss());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
  })
);

// Body parser
app.use(express.json());

/* ======================= 🔗 DATABASE ======================= */
connectDB().then(() => {
  // Init data après connexion
  initializeDefaultTariff();
}).catch(err => {
  console.error('Impossible de se connecter à la base de données');
  process.exit(1);
});

/* =======================  ROUTES ======================= */
app.use('/api/auth', authRoutes);
app.use('/', authRoutes);
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/stays', require('./routes/stayRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/tariffs', require('./routes/tariffRoutes'));
app.use('/api/entries', require('./routes/entryRoutes'));
app.use('/api/user-report', require('./routes/userReportRoutes'));
app.use('/api/residences', require('./routes/residenceRoutes'));

// Route santé (test mobile)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ======================= 📚 SWAGGER DOCS ======================= */
const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* ======================= ▶️ START SERVER ======================= */
app.listen(PORT, () => {
  console.log(` Serveur lancé sur le port ${PORT}`);
});

/* ======================= ⚙️ INIT DEFAULT DATA ======================= */
const initializeDefaultTariff = async () => {
  try {
    const existingTariff = await Tariff.findOne();
    if (!existingTariff) {
      await Tariff.create({
        hourRate: 10,
        nightRate: 50,
        tva: 0,
      });
      console.log('Tarif par défaut initialisé.');
    }
  } catch (err) {
    console.error('Erreur init tarif:', err);
  }
};
