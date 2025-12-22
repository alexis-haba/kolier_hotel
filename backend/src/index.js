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

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   🔐 SECURITY & CORS
======================= */

app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://kolier-hotels-web.onrender.com' // ✅ FRONTEND (IMPORTANT)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🔥 Important pour Render (preflight)
app.options('*', cors());

app.use(xss());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
}));

// Body parser
app.use(express.json());

/* =======================
   🔗 DATABASE
======================= */

connectDB();

/* =======================
   🚀 ROUTES
======================= */

app.use('/api/auth', require('./routes/authRoutes'));
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

/* =======================
   📚 SWAGGER DOCS
======================= */

const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* =======================
   ▶️ START SERVER
======================= */

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

/* =======================
   ⚙️ INIT DEFAULT DATA
======================= */

const initializeDefaultTariff = async () => {
  try {
    const existingTariff = await Tariff.findOne();
    if (!existingTariff) {
      await Tariff.create({ hourRate: 10, nightRate: 50, tva: 0 });
      console.log('✅ Tarif par défaut initialisé.');
    }
  } catch (err) {
    console.error('❌ Erreur init tarif:', err);
  }
};

initializeDefaultTariff();
