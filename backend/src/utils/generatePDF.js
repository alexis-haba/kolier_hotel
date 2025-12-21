const { jsPDF } = require("jspdf");

// ================== CONSTANTES DE COLONNES ==================
const COL_LABEL = 10;
const COL_INCOME = 70;
const COL_EXPENSE = 120;
const COL_BALANCE = 190; // alignée à droite partout

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
function generateDailyPDF(data, date) {
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
module.exports = {
  formatFG,
  generatePDF,
  generateDailyPDF,
  generateWeeklyPDF,
  generateMonthlyPDF,
  generateAnnualPDF,
};
