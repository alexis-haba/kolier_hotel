const Stay = require('../models/Stay');
const Expense = require('../models/Expense');
const Room = require('../models/Room');
const Entry = require('../models/DailyEntry');
const { generatePDF } = require('../utils/generatePDF');
const { generateDailyPDF, generateWeeklyPDF, generateMonthlyPDF, generateAnnualPDF } = require('../utils/generatePDF');
const { generateExcel } = require('../utils/generateExcel');
const getWorkdayRange = require('../utils/getWorkdayRange');

// ================== RAPPORTS ==================
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getWorkdayRange(new Date(date));

    const [stays, expenses] = await Promise.all([
      Stay.aggregate([
        { $match: { startTime: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$amount' },
            totalStays: { $sum: 1 },
            nightStays: { $sum: { $cond: ['$isNight', 1, 0] } }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
      ])
    ]);

    const income = stays[0]?.totalIncome || 0;
    const exp = expenses[0]?.totalExpenses || 0;
    const totalStays = stays[0]?.totalStays || 0;
    const nightStays = stays[0]?.nightStays || 0;
    const occupation = (totalStays / (await Room.countDocuments())) * 100 || 0;

    res.json({
      range: { start, end },
      income,
      expenses: exp,
      remaining: income - exp,
      totalStays,
      nightStays,
      occupation
    });
  } catch (err) {
    console.error("getDailyReport error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(year, month - 1, 1, 8, 0, 0, 0); // commence à 8h
    const end = new Date(year, month, 1, 7, 59, 59, 999);  // finit le dernier jour à 7h59

    const [stays, expenses] = await Promise.all([
      Stay.aggregate([
        { $match: { startTime: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$amount' },
            totalStays: { $sum: 1 },
            nightStays: { $sum: { $cond: ['$isNight', 1, 0] } }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
      ])
    ]);

    const income = stays[0]?.totalIncome || 0;
    const exp = expenses[0]?.totalExpenses || 0;
    const totalStays = stays[0]?.totalStays || 0;
    const nightStays = stays[0]?.nightStays || 0;
    const occupation = (totalStays / (await Room.countDocuments())) * 100 || 0;

    res.json({
      range: { start, end },
      income,
      expenses: exp,
      remaining: income - exp,
      totalStays,
      nightStays,
      occupation
    });
  } catch (err) {
    console.error("getMonthlyReport error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};

exports.getAnnualReport = async (req, res) => {
  try {
    const { year } = req.query;
    const start = new Date(year, 0, 1, 8, 0, 0, 0);
    const end = new Date(year + 1, 0, 1, 7, 59, 59, 999);

    const [stays, expenses] = await Promise.all([
      Stay.aggregate([
        { $match: { startTime: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$amount' },
            totalStays: { $sum: 1 },
            nightStays: { $sum: { $cond: ['$isNight', 1, 0] } }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
      ])
    ]);

    const income = stays[0]?.totalIncome || 0;
    const exp = expenses[0]?.totalExpenses || 0;
    const totalStays = stays[0]?.totalStays || 0;
    const nightStays = stays[0]?.nightStays || 0;
    const occupation = (totalStays / (await Room.countDocuments())) * 100 || 0;

    res.json({
      range: { start, end },
      income,
      expenses: exp,
      remaining: income - exp,
      totalStays,
      nightStays,
      occupation
    });
  } catch (err) {
    console.error("getAnnualReport error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};




// ================== GRAPHIQUES ==================

// === 1️⃣ PAR HEURE (journée de 8h à 8h)
exports.getDailyGraphData = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getWorkdayRange(new Date(date));

    const stays = await Stay.find({
      startTime: { $gte: start, $lt: end }
    });

    const expenses = await Expense.find({
      date: { $gte: start, $lt: end }
    });

    // Initialiser les 24 heures (8h → 8h)
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (8 + i) % 24;
      return {
        hour,
        label: `${hour.toString().padStart(2, "0")}:00`,
        income: 0,
        totalStays: 0,
        expenses: 0,
        remaining: 0
      };
    });

    // === STAYS ===
    for (const stay of stays) {
      // 🟢 HEURE NORMALE
      if (stay.phase === "hour") {
        const h = new Date(stay.startTime).getHours();
        const bucket = hours.find(x => x.hour === h);
        if (bucket) {
          bucket.income += stay.amount || 0;
          bucket.totalStays += 1;
        }
      }

      // 🌙 NUITÉE → ajoutée à 08:00
      if (stay.phase === "night") {
        const bucket = hours.find(x => x.hour === 8);
        if (bucket) {
          bucket.income += stay.amount || 0;
          bucket.totalStays += 1;
        }
      }
    }

    // === EXPENSES ===
    for (const exp of expenses) {
      const h = new Date(exp.date).getHours();
      const bucket = hours.find(x => x.hour === h);
      if (bucket) {
        bucket.expenses += exp.amount || 0;
      }
    }

    // Calcul remaining
    for (const h of hours) {
      h.remaining = h.income - h.expenses;
    }

    res.json({
      range: { start, end },
      data: hours
    });
  } catch (err) {
    console.error("getDailyGraphData error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};


// === 2️⃣ PAR JOUR (hebdomadaire, chaque jour = 8h→8h)
exports.getWeeklyGraphData = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6); // 7 derniers jours

    const result = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(lastWeek);
      currentDay.setDate(lastWeek.getDate() + i);

      // ✅ journée de travail 8h → 8h
      const start = new Date(currentDay);
      start.setHours(8, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      end.setHours(7, 59, 59, 999);

      const [stays, expenses] = await Promise.all([
        Stay.find({ startTime: { $gte: start, $lt: end } }),
        Expense.find({ date: { $gte: start, $lt: end } })
      ]);

      const totalIncome = stays.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      result.push({
        day: start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    res.json(result);
  } catch (err) {
    console.error("getWeeklyGraphData error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};


// === 3️⃣ PAR MOIS (chaque mois = somme des journées 8h→8h)
exports.getMonthlyGraphData = async (req, res) => {
  try {
    const { year } = req.query;
    const data = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1, 8, 0, 0, 0);
      const end = new Date(year, month + 1, 1, 8, 0, 0, 0);

      const [stays, expenses, entries] = await Promise.all([
        Stay.find({ startTime: { $gte: start, $lt: end } }),
        Expense.find({ date: { $gte: start, $lt: end } }),
        Entry.find({ date: { $gte: start, $lt: end } })
      ]);

      // === REVENUS ===
      const hourIncome = stays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = stays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const entriesIncome = entries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      const totalIncome = hourIncome + nightIncome + entriesIncome;

      // === DÉPENSES ===
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      );

      data.push({
        month: month + 1,
        label: start.toLocaleString("fr-FR", { month: "short" }),
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    res.json(data);
  } catch (err) {
    console.error("getMonthlyGraphData error:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};



// === 4️⃣ PAR ANNÉE (8h→8h pour cohérence, agrégé globalement)
exports.getAnnualGraphData = async (req, res) => {
  try {
    const stays = await Stay.find();
    const expenses = await Expense.find();
    const entries = await Entry.find();

    const years = [
      ...new Set([
        ...stays.map(s => new Date(s.startTime).getFullYear()),
        ...expenses.map(e => new Date(e.date).getFullYear()),
        ...entries.map(e => new Date(e.date).getFullYear())
      ])
    ].sort();

    const data = years.map(year => {
      const yearStays = stays.filter(
        s => new Date(s.startTime).getFullYear() === year
      );

      const yearExpenses = expenses.filter(
        e => new Date(e.date).getFullYear() === year
      );

      const yearEntries = entries.filter(
        e => new Date(e.date).getFullYear() === year
      );

      const hourIncome = yearStays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = yearStays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const entriesIncome = yearEntries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      const totalIncome = hourIncome + nightIncome + entriesIncome;

      const totalExpenses = yearExpenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      );

      return {
        year,
        label: year.toString(),
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      };
    });

    res.json(data);
  } catch (err) {
    console.error("getAnnualGraphData error:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};




// ================== SUMMARY ==================

// === RÉSUMÉ DU JOUR (8h→8h) ===
exports.getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getWorkdayRange(today);

    const stays = await Stay.find({ startTime: { $gte: start, $lt: end } });
    const expenses = await Expense.find({ date: { $gte: start, $lt: end } });

    const totalIncome = stays.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
      range: { start, end },
      totalIncome,
      totalExpenses,
      remaining: totalIncome - totalExpenses,
      stays,
      expenses
    });
  } catch (err) {
    console.error("getTodaySummary error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};

// === RÉSUMÉ HEBDOMADAIRE (chaque jour de 8h→8h) ===
exports.getWeeklySummary = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);

    const result = [];

    for (let i = 0; i < 7; i++) {
      const refDate = new Date(lastWeek);
      refDate.setDate(lastWeek.getDate() + i);

      const { start, end } = getWorkdayRange(refDate);

      // === STAYS ===
      const stays = await Stay.find({
        startTime: { $gte: start, $lte: end }
      });

      const hourIncome = stays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = stays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      // === ENTRIES CAISSE ===
      const entries = await Entry.find({
        date: { $gte: start, $lte: end }
      });

      const entriesIncome = entries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      // === DÉPENSES ===
      const expenses = await Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const totalExpenses = expenses[0]?.total || 0;

      // ✅ TOTAL CORRECT (HEURE + NUITÉE + ENTRÉES)
      const totalIncome = hourIncome + nightIncome + entriesIncome;

      result.push({
        day: start.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short"
        }),
        in: totalIncome,
        out: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Erreur getWeeklySummary :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// === RÉSUMÉ QUOTIDIEN DÉTAILLÉ (déjà 8h→8h, OK) ===
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getWorkdayRange(date ? new Date(date) : new Date());

    // Stays
    const stays = await Stay.find({ startTime: { $gte: start, $lte: end } });

    const hourIncome = stays
      .filter(s => s.phase === "hour")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const nightIncome = stays
      .filter(s => s.phase === "night")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const stayExpenses = stays.reduce(
      (sum, s) => sum + (s.expenses || []).reduce((x, e) => x + (e.amount || 0), 0),
      0
    );

    // Daily Entries
    const entries = await Entry.find({ date: { $gte: start, $lte: end } });

    const entriesIncome = entries.reduce((sum, e) => sum + (e.totalIncome || 0), 0);
    const entriesExpenses = entries.reduce((sum, e) => sum + (e.totalExpenses || 0), 0);

    // Dépenses directes
    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
    ]);

    const otherExpenses = expenses[0]?.totalExpenses || 0;

    // Totaux
    const totalIncome = hourIncome + nightIncome + entriesIncome;
    const totalExpenses = stayExpenses + entriesExpenses + otherExpenses;
    const remaining = totalIncome - totalExpenses;
    
    res.json({
      range: { start, end },
      hourIncome,
      nightIncome,
      entriesIncome,
      totalIncome,
      totalExpenses,
      remaining
    });
  } catch (err) {
    console.error("getDailySummary error:", err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};



// ================== EXPORTS ==================
// === PDF QUOTIDIEN (8h → 8h) ===
exports.exportDailyPDF = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getWorkdayRange(new Date(date));

    const stays = await Stay.find({ startTime: { $gte: start, $lt: end } });
    const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
    const entries = await Entry.find({ date: { $gte: start, $lt: end } });

    const hourIncome = stays
      .filter(s => s.phase === "hour")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const nightIncome = stays
      .filter(s => s.phase === "night")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const entriesIncome = entries.reduce(
      (sum, e) => sum + (e.totalIncome || 0),
      0
    );

    const totalIncome = hourIncome + nightIncome + entriesIncome;

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    const pdfBuffer = generateDailyPDF({
      hourIncome,
      nightIncome,
      entriesIncome,
      income: totalIncome,
      expenses: totalExpenses,
      remaining: totalIncome - totalExpenses,
      totalStays: stays.length,
      nightStays: stays.filter(s => s.phase === "night").length,
      range: { start, end }
    }, date);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="releve-${date}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("exportDailyPDF error:", err);
    res.status(500).send("Erreur export PDF quotidien");
  }
};


// === PDF HEBDOMADAIRE (chaque jour de 8h→8h) ===
exports.exportWeeklyPDF = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);

    const result = [];

    for (let i = 0; i < 7; i++) {
      const refDate = new Date(lastWeek);
      refDate.setDate(lastWeek.getDate() + i);

      const { start, end } = getWorkdayRange(refDate);

      const stays = await Stay.find({ startTime: { $gte: start, $lt: end } });
      const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
      const entries = await Entry.find({ date: { $gte: start, $lt: end } });

      const hourIncome = stays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = stays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const entriesIncome = entries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      const totalIncome = hourIncome + nightIncome + entriesIncome;

      const totalExpenses = expenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      );

      result.push({
        date: start.toLocaleDateString("fr-FR"),
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    const pdfBuffer = generateWeeklyPDF(result);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="releve-semaine.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("exportWeeklyPDF error:", err);
    res.status(500).send("Erreur export PDF hebdomadaire");
  }
};


// === PDF MENSUEL (chaque jour de 8h→8h) ===
exports.exportMonthlyPDF = async (req, res) => {
  try {
    const { month, year } = req.query;
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const refDate = new Date(year, month - 1, d);
      const { start, end } = getWorkdayRange(refDate);

      const stays = await Stay.find({ startTime: { $gte: start, $lt: end } });
      const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
      const entries = await Entry.find({ date: { $gte: start, $lt: end } });

      // === REVENUS ===
      const hourIncome = stays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = stays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const entriesIncome = entries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      const totalIncome = hourIncome + nightIncome + entriesIncome;

      // === DÉPENSES ===
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      );

      data.push({
        date: `${d}/${month}`,
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    const pdfBuffer = generateMonthlyPDF(data, month, year);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="releve-mois-${month}-${year}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("exportMonthlyPDF error:", err);
    res.status(500).send("Erreur export PDF mensuel");
  }
};


// === PDF ANNUEL (chaque jour de 8h→8h sur le mois) ===
exports.exportAnnualPDF = async (req, res) => {
  try {
    const { year } = req.query;
    const result = [];

    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1, 8, 0, 0, 0);
      const end = new Date(year, m + 1, 1, 8, 0, 0, 0);

      const stays = await Stay.find({ startTime: { $gte: start, $lt: end } });
      const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
      const entries = await Entry.find({ date: { $gte: start, $lt: end } });

      // === REVENUS ===
      const hourIncome = stays
        .filter(s => s.phase === "hour")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const nightIncome = stays
        .filter(s => s.phase === "night")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const entriesIncome = entries.reduce(
        (sum, e) => sum + (e.totalIncome || 0),
        0
      );

      const totalIncome = hourIncome + nightIncome + entriesIncome;

      // === DÉPENSES ===
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      );

      result.push({
        label: start.toLocaleString("fr-FR", { month: "long" }),
        income: totalIncome,
        expenses: totalExpenses,
        remaining: totalIncome - totalExpenses
      });
    }

    const pdfBuffer = generateAnnualPDF(result, year);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="releve-${year}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("exportAnnualPDF error:", err);
    res.status(500).send("Erreur export PDF annuel");
  }
};





// ================== EXPORT EXCEL ==================

exports.exportExcel = async (req, res) => {
  try {
    const { date } = req.query;
    const data = [
      { date: date || '2025-09-04', income: 2000, expenses: 500 },
      { date: date || '2025-09-03', income: 1500, expenses: 300 },
    ];

    const buffer = await generateExcel(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=releve-${date || 'report'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur export Excel');
  }
};




// ================== GENERATE RECEIPT ==================
exports.generateReceipt = async (req, res) => {
  try {
    const { stayId } = req.params;
    const stay = await Stay.findById(stayId).populate('roomId');

    if (!stay) {
      return res.status(404).json({ msg: "Séjour introuvable" });
    }

    const pdf = generatePDF({
      stay: {
        room: stay.roomId?.number || "N/A",
        amount: stay.amount || 0,
        start: stay.startTime,
        end: stay.endTime || "En cours"
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error("generateReceipt error:", err);
    res.status(500).json({ msg: "Erreur génération reçu", error: err.message });
  }
};
