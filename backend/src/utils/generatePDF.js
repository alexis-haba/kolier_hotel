// ================== PDF MENSUEL DÉTAILLÉ ==================
function generateMonthlyPDFDetailed(monthlyData, month, year, showSummary = true) {
  // On réutilise la logique de generateWeeklyPDFDetailed mais sur chaque jour du mois
  const doc = new jsPDF();
  monthlyData.forEach((day, idx) => {
    if (idx > 0) doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RELEVÉ JOURNALIER`, 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${day.date}`, 105, y, { align: "center" });
    y += 12;
    // Saut de page avant le titre du tableau
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES ENTRÉES", COL_LABEL, y);
    y += 7;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Chambre", COL_LABEL, y);
    doc.text("Type", COL_LABEL + 15, y);
    doc.text("Montant", COL_LABEL + 32, y);
    doc.text("Solde", COL_LABEL + 57, y);
    doc.text("Début", COL_LABEL + 85, y);
    doc.text("Fin", COL_LABEL + 120, y);
    doc.text("Paiement", COL_LABEL + 155, y);
    doc.text("Utilisateur", COL_LABEL + 175, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(10, y, 210, y);
    y += 6;
    if (Array.isArray(day.entries) && day.entries.length > 0) {
      day.entries.forEach(entry => {
        // Saut de page avant chaque ligne du tableau
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(String(entry.chambre || ''), COL_LABEL, y);
        doc.text(String(entry.type || ''), COL_LABEL + 15, y);
        doc.text(formatFG(entry.montant), COL_LABEL + 32, y);
        doc.text(entry.solde ? formatFG(entry.solde) : '', COL_LABEL + 57, y);
        doc.text(String(entry.debut || ''), COL_LABEL + 85, y);
        doc.text(String(entry.fin || ''), COL_LABEL + 120, y);
        doc.text(String(entry.paiement || ''), COL_LABEL + 155, y);
        doc.text(String(entry.utilisateur || ''), COL_LABEL + 175, y);
        y += 6;
      });
    } else {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text('Aucune entrée', COL_LABEL, y);
      y += 6;
    }
    y += 4;
    doc.line(10, y, 210, y);
    y += 6;
    // Saut de page avant chaque section principale
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ FINANCIER", COL_LABEL, y);
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Revenus totaux :", COL_LABEL, y);
    doc.text(formatFG(day.income), COL_BALANCE, y, { align: "right" });
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Dépenses :", COL_LABEL, y);
    doc.text(formatFG(day.expenses), COL_BALANCE, y, { align: "right" });
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Solde :", COL_LABEL, y);
    doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });
    y += 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVITÉ HÔTELIÈRE", COL_LABEL, y);
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nombre total de séjours :", COL_LABEL, y);
    doc.text(formatNumber(day.totalStays), COL_BALANCE, y, { align: "right" });
    y += 6;
    // Contrôle spécial pour éviter la superposition avec le pied de page et le début du bloc suivant
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Nombre de nuitées :", COL_LABEL, y);
    doc.text(formatNumber(day.nightStays), COL_BALANCE, y, { align: "right" });
    // Saut de page systématique après chaque bloc journalier
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.addPage();
    y = 20;
  });
  if (showSummary) {
    // Dernière page : résumé mensuel (tableau)
    doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RÉSUMÉ MENSUEL`, 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Date", COL_LABEL, y);
    doc.text("Revenus", COL_INCOME, y);
    doc.text("Dépenses", COL_EXPENSE, y);
    doc.text("Solde", COL_BALANCE, y, { align: "right" });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalRemaining = 0;
    monthlyData.forEach(day => {
      doc.text(day.date, COL_LABEL, y);
      doc.text(formatFG(day.income), COL_INCOME, y);
      doc.text(formatFG(day.expenses), COL_EXPENSE, y);
      doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });
      totalIncome += day.income;
      totalExpenses += day.expenses;
      totalRemaining += day.remaining;
      y += 6;
    });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL MENSUEL", COL_LABEL, y);
    doc.text(formatFG(totalIncome), COL_INCOME, y);
    doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
    doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });
  }
  return Buffer.from(doc.output("arraybuffer"));
}

// ================== PDF ANNUEL DÉTAILLÉ ==================
function generateAnnualPDFDetailed(annualData, year, showSummary = true) {
  // On réutilise la logique de generateWeeklyPDFDetailed mais sur chaque mois de l'année
  const doc = new jsPDF();
  annualData.forEach((month, idx) => {
    if (idx > 0) doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RELEVÉ MENSUEL`, 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Mois : ${month.label}`, 105, y, { align: "center" });
    y += 12;
    if (month.days && month.days.length > 0) {
      month.days.forEach(day => {
        // Saut de page avant le titre du tableau
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Date : ${day.date}`, COL_LABEL, y);
        y += 7;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text("DÉTAIL DES ENTRÉES", COL_LABEL, y);
        y += 7;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Chambre", COL_LABEL, y);
        doc.text("Type", COL_LABEL + 15, y);
        doc.text("Montant", COL_LABEL + 32, y);
        doc.text("Solde", COL_LABEL + 57, y);
        doc.text("Début", COL_LABEL + 85, y);
        doc.text("Fin", COL_LABEL + 120, y);
        doc.text("Paiement", COL_LABEL + 155, y);
        doc.text("Utilisateur", COL_LABEL + 175, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.line(10, y, 210, y);
        y += 6;
        if (Array.isArray(day.entries) && day.entries.length > 0) {
          day.entries.forEach(entry => {
            // Saut de page avant chaque ligne du tableau
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(String(entry.chambre || ''), COL_LABEL, y);
            doc.text(String(entry.type || ''), COL_LABEL + 15, y);
            doc.text(formatFG(entry.montant), COL_LABEL + 32, y);
            doc.text(entry.solde ? formatFG(entry.solde) : '', COL_LABEL + 57, y);
            doc.text(String(entry.debut || ''), COL_LABEL + 85, y);
            doc.text(String(entry.fin || ''), COL_LABEL + 120, y);
            doc.text(String(entry.paiement || ''), COL_LABEL + 155, y);
            doc.text(String(entry.utilisateur || ''), COL_LABEL + 175, y);
            y += 6;
          });
        } else {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text('Aucune entrée', COL_LABEL, y);
          y += 6;
        }
        y += 4;
        doc.line(10, y, 210, y);
        y += 6;
        // Saut de page avant chaque section principale
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RÉSUMÉ FINANCIER", COL_LABEL, y);
        y += 6;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Revenus totaux :", COL_LABEL, y);
        doc.text(formatFG(day.income), COL_BALANCE, y, { align: "right" });
        y += 6;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text("Dépenses :", COL_LABEL, y);
        doc.text(formatFG(day.expenses), COL_BALANCE, y, { align: "right" });
        y += 6;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text("Solde :", COL_LABEL, y);
        doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });
        y += 10;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("ACTIVITÉ HÔTELIÈRE", COL_LABEL, y);
        y += 6;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Nombre total de séjours :", COL_LABEL, y);
        doc.text(formatNumber(day.totalStays), COL_BALANCE, y, { align: "right" });
        y += 6;
        // Contrôle spécial pour éviter la superposition avec le pied de page et le début du bloc suivant
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text("Nombre de nuitées :", COL_LABEL, y);
        doc.text(formatNumber(day.nightStays), COL_BALANCE, y, { align: "right" });
        // Saut de page systématique après chaque bloc journalier
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.addPage();
        y = 20;
      });
    }
    // Ajout du résumé financier et activité hôtelière à la fin de chaque mois
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ MENSUEL", COL_LABEL, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Revenus totaux :", COL_LABEL, y);
    doc.text(formatFG(month.income), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Dépenses :", COL_LABEL, y);
    doc.text(formatFG(month.expenses), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Solde :", COL_LABEL, y);
    doc.text(formatFG(month.remaining), COL_BALANCE, y, { align: "right" });
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVITÉ HÔTELIÈRE", COL_LABEL, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nombre total de séjours :", COL_LABEL, y);
    doc.text(formatNumber(month.totalStays), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Nombre de nuitées :", COL_LABEL, y);
    doc.text(formatNumber(month.nightStays), COL_BALANCE, y, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Document généré automatiquement – The Vibes App",
      105,
      285,
      { align: "center" }
    );
    doc.setFontSize(10);
    doc.setTextColor(0);
  });
  if (showSummary) {
    // Dernière page : résumé annuel (tableau)
    doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RÉSUMÉ ANNUEL`, 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Mois", COL_LABEL, y);
    doc.text("Revenus", COL_INCOME, y);
    doc.text("Dépenses", COL_EXPENSE, y);
    doc.text("Solde", COL_BALANCE, y, { align: "right" });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalRemaining = 0;
    annualData.forEach(month => {
      doc.text(month.label, COL_LABEL, y);
      doc.text(formatFG(month.income), COL_INCOME, y);
      doc.text(formatFG(month.expenses), COL_EXPENSE, y);
      doc.text(formatFG(month.remaining), COL_BALANCE, y, { align: "right" });
      totalIncome += month.income;
      totalExpenses += month.expenses;
      totalRemaining += month.remaining;
      y += 6;
    });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ANNUEL", COL_LABEL, y);
    doc.text(formatFG(totalIncome), COL_INCOME, y);
    doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
    doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });
  }
  return Buffer.from(doc.output("arraybuffer"));
}
const { jsPDF } = require("jspdf");

// ================== CONSTANTES DE COLONNES ==================
const COL_LABEL = 10;
const COL_INCOME = 55;
const COL_EXPENSE = 100;
const COL_BALANCE = 150; // alignée à droite partout

// ================== HELPERS ==================
function formatFG(value) {
  if (typeof value !== "number") value = Number(value) || 0;
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FG";
}

function formatNumber(value) {
  if (typeof value !== "number") value = Number(value) || 0;
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ================== PDF REÇU ==================
function generatePDF(data) {
  const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text("Reçu Séjour", 10, 10);

  doc.setFontSize(10);
  doc.text(`Chambre: ${data.stay.room}`, 10, 20);
  doc.text(`Montant: ${formatFG(data.stay.amount)}`, 10, 30);
  doc.text(`Début: ${data.stay.start}`, 10, 40);
  doc.text(`Fin: ${data.stay.end}`, 10, 50);

  return Buffer.from(doc.output("arraybuffer"));
}

// ================== PDF JOURNALIER ==================
function generateDailyPDF(data, date, mode = 'details') {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELEVÉ JOURNALIER", 105, y, { align: "center" });

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${date}`, 105, y, { align: "center" });

  y += 12;

  if (mode === 'details' && Array.isArray(data.entries) && data.entries.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES ENTRÉES", COL_LABEL, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Chambre", COL_LABEL, y);
    doc.text("Type", COL_LABEL + 15, y);
    doc.text("Montant", COL_LABEL + 32, y);
    doc.text("Solde", COL_LABEL + 57, y);
    doc.text("Début", COL_LABEL + 85, y);
    doc.text("Fin", COL_LABEL + 120, y);
    doc.text("Paiement", COL_LABEL + 155, y);
    doc.text("Utilisateur", COL_LABEL + 175, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(10, y, 210, y);
    y += 6;
    data.entries.forEach(entry => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(String(entry.chambre || ''), COL_LABEL, y);
      doc.text(String(entry.type || ''), COL_LABEL + 15, y);
      doc.text(formatFG(entry.montant), COL_LABEL + 32, y);
      doc.text(entry.solde ? formatFG(entry.solde) : '', COL_LABEL + 57, y);
      doc.text(String(entry.debut || ''), COL_LABEL + 85, y);
      doc.text(String(entry.fin || ''), COL_LABEL + 120, y);
      doc.text(String(entry.paiement || ''), COL_LABEL + 155, y);
      doc.text(String(entry.utilisateur || ''), COL_LABEL + 175, y);
      y += 6;
    });
    y += 4;
    doc.line(10, y, 210, y);
    y += 6;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ FINANCIER", COL_LABEL, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Revenus totaux :", COL_LABEL, y);
  doc.text(formatFG(data.income), COL_BALANCE, y, { align: "right" });
  y += 6;

  doc.text("Dépenses :", COL_LABEL, y);
  doc.text(formatFG(data.expenses), COL_BALANCE, y, { align: "right" });
  y += 6;

  doc.text("Solde :", COL_LABEL, y);
  doc.text(formatFG(data.remaining), COL_BALANCE, y, { align: "right" });

  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVITÉ HÔTELIÈRE", COL_LABEL, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Nombre total de séjours :", COL_LABEL, y);
  doc.text(formatNumber(data.totalStays), COL_BALANCE, y, { align: "right" });
  y += 6;

  doc.text("Nombre de nuitées :", COL_LABEL, y);
  doc.text(formatNumber(data.nightStays), COL_BALANCE, y, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Document généré automatiquement – The Vibes App",
    105,
    285,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}

// ================== PDF HEBDOMADAIRE ==================
function generateWeeklyPDF(weeklyData) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELEVÉ HEBDOMADAIRE", 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Jour", COL_LABEL, y);
  doc.text("Revenus", COL_INCOME, y);
  doc.text("Dépenses", COL_EXPENSE, y);
  doc.text("Solde", COL_BALANCE, y, { align: "right" });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRemaining = 0;

  weeklyData.forEach(day => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(day.date, COL_LABEL, y);
    doc.text(formatFG(day.income), COL_INCOME, y);
    doc.text(formatFG(day.expenses), COL_EXPENSE, y);
    doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });

    totalIncome += day.income;
    totalExpenses += day.expenses;
    totalRemaining += day.remaining;

    y += 6;
  });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", COL_LABEL, y);
  doc.text(formatFG(totalIncome), COL_INCOME, y);
  doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
  doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ================== PDF MENSUEL ==================
function generateMonthlyPDF(monthlyData, month, year) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`RELEVÉ MENSUEL – ${month}/${year}`, 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Date", COL_LABEL, y);
  doc.text("Revenus", COL_INCOME, y);
  doc.text("Dépenses", COL_EXPENSE, y);
  doc.text("Solde", COL_BALANCE, y, { align: "right" });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRemaining = 0;

  monthlyData.forEach(day => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(day.date, COL_LABEL, y);
    doc.text(formatFG(day.income), COL_INCOME, y);
    doc.text(formatFG(day.expenses), COL_EXPENSE, y);
    doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });

    totalIncome += day.income;
    totalExpenses += day.expenses;
    totalRemaining += day.remaining;

    y += 6;
  });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL MENSUEL", COL_LABEL, y);
  doc.text(formatFG(totalIncome), COL_INCOME, y);
  doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
  doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ================== PDF ANNUEL ==================
function generateAnnualPDF(annualData, year) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`RELEVÉ ANNUEL – ${year}`, 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Mois", COL_LABEL, y);
  doc.text("Revenus", COL_INCOME, y);
  doc.text("Dépenses", COL_EXPENSE, y);
  doc.text("Solde", COL_BALANCE, y, { align: "right" });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRemaining = 0;

  annualData.forEach(month => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(month.label, COL_LABEL, y);
    doc.text(formatFG(month.income), COL_INCOME, y);
    doc.text(formatFG(month.expenses), COL_EXPENSE, y);
    doc.text(formatFG(month.remaining), COL_BALANCE, y, { align: "right" });

    totalIncome += month.income;
    totalExpenses += month.expenses;
    totalRemaining += month.remaining;

    y += 6;
  });

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL ANNUEL", COL_LABEL, y);
  doc.text(formatFG(totalIncome), COL_INCOME, y);
  doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
  doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ================== EXPORTS ==================

// ================== PDF HEBDOMADAIRE DÉTAILLÉ ==================

function generateWeeklyPDFDetailed(weeklyData, showSummary = true) {
  const doc = new jsPDF();

  // 1 page par jour (détail complet ligne par ligne)
  weeklyData.forEach((day, idx) => {
    if (idx > 0) doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RELEVÉ JOURNALIER`, 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${day.date}`, 105, y, { align: "center" });
    y += 12;

    // Tableau détaillé
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES ENTRÉES", COL_LABEL, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Chambre", COL_LABEL, y);
    doc.text("Type", COL_LABEL + 15, y);
    doc.text("Montant", COL_LABEL + 32, y);
    doc.text("Solde", COL_LABEL + 57, y);
    doc.text("Début", COL_LABEL + 85, y);
    doc.text("Fin", COL_LABEL + 120, y);
    doc.text("Paiement", COL_LABEL + 155, y);
    doc.text("Utilisateur", COL_LABEL + 175, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(10, y, 210, y);
    y += 6;

    if (Array.isArray(day.entries) && day.entries.length > 0) {
      day.entries.forEach(entry => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(String(entry.chambre || ''), COL_LABEL, y);
        doc.text(String(entry.type || ''), COL_LABEL + 15, y);
        doc.text(formatFG(entry.montant), COL_LABEL + 32, y);
        doc.text(entry.solde ? formatFG(entry.solde) : '', COL_LABEL + 57, y);
        doc.text(String(entry.debut || ''), COL_LABEL + 85, y);
        doc.text(String(entry.fin || ''), COL_LABEL + 120, y);
        doc.text(String(entry.paiement || ''), COL_LABEL + 155, y);
        doc.text(String(entry.utilisateur || ''), COL_LABEL + 175, y);
        y += 6;
      });
    } else {
      doc.text('Aucune entrée', COL_LABEL, y);
      y += 6;
    }

    y += 4;
    doc.line(10, y, 210, y);
    y += 6;

    // Résumé financier du jour
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ FINANCIER", COL_LABEL, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Revenus totaux :", COL_LABEL, y);
    doc.text(formatFG(day.income), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Dépenses :", COL_LABEL, y);
    doc.text(formatFG(day.expenses), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Solde :", COL_LABEL, y);
    doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVITÉ HÔTELIÈRE", COL_LABEL, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nombre total de séjours :", COL_LABEL, y);
    doc.text(formatNumber(day.totalStays), COL_BALANCE, y, { align: "right" });
    y += 6;
    doc.text("Nombre de nuitées :", COL_LABEL, y);
    doc.text(formatNumber(day.nightStays), COL_BALANCE, y, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Document généré automatiquement – The Vibes App",
      105,
      285,
      { align: "center" }
    );
    doc.setFontSize(10);
    doc.setTextColor(0);
  });

  if (showSummary) {
    // Dernière page : résumé hebdo (tableau)
    doc.addPage();
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ HEBDOMADAIRE", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Jour", COL_LABEL, y);
    doc.text("Revenus", COL_INCOME, y);
    doc.text("Dépenses", COL_EXPENSE, y);
    doc.text("Solde", COL_BALANCE, y, { align: "right" });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalRemaining = 0;
    weeklyData.forEach(day => {
      doc.text(day.date, COL_LABEL, y);
      doc.text(formatFG(day.income), COL_INCOME, y);
      doc.text(formatFG(day.expenses), COL_EXPENSE, y);
      doc.text(formatFG(day.remaining), COL_BALANCE, y, { align: "right" });
      totalIncome += day.income;
      totalExpenses += day.expenses;
      totalRemaining += day.remaining;
      y += 6;
    });
    y += 4;
    doc.line(10, y, 200, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", COL_LABEL, y);
    doc.text(formatFG(totalIncome), COL_INCOME, y);
    doc.text(formatFG(totalExpenses), COL_EXPENSE, y);
    doc.text(formatFG(totalRemaining), COL_BALANCE, y, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

module.exports = {
  formatFG,
  generatePDF,
  generateDailyPDF,
  generateWeeklyPDF,
  generateWeeklyPDFDetailed,
  generateMonthlyPDF,
  generateAnnualPDF,
  generateMonthlyPDFDetailed,
  generateAnnualPDFDetailed,
};
