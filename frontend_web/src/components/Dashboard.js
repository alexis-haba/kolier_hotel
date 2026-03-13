// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';
import StayList from './StayList';
import ExpenseList from './ExpenseList';
import Filters from './Filters';
import { 
  FaBalanceScale, FaFilePdf,
  FaChartBar, FaCalendarAlt 
} from 'react-icons/fa';
import DatePicker from "react-multi-date-picker";
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Dashboard = () => {
  // ================== STATES ==================
  const [dailySummary, setDailySummary] = useState({});
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [annualSummary, setAnnualSummary] = useState({});
  
  const [weekData, setWeekData] = useState({ labels: [], datasets: [] });
  const [monthData, setMonthData] = useState({ labels: [], datasets: [] });
  const [annualData, setAnnualData] = useState({ labels: [], datasets: [] });

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    roomId: '',
    type: '',
    phase: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickRange, setQuickRange] = useState('today');
  const [showAllKpis, setShowAllKpis] = useState(false);

  const [monthlyWordMode, setMonthlyWordMode] = useState('details');
  const [annualWordMode, setAnnualWordMode] = useState('details');
  const [weeklyPdfMode, setWeeklyPdfMode] = useState('details');
  const [weeklyWordMode, setWeeklyWordMode] = useState('details');
  const [monthlyPdfMode, setMonthlyPdfMode] = useState('details');
  const [annualPdfMode, setAnnualPdfMode] = useState('details');

  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [pdfExportDate, setPdfExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [pdfExportType, setPdfExportType] = useState('day');
  const [pdfExportDates, setPdfExportDates] = useState([new Date().toISOString().split('T')[0]]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('daily');
  const [exportFormat, setExportFormat] = useState('summary');
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  // ================== HELPERS ==================
  const currentDate = new Date();
  const getDateBadge = () => {
    const selectedDate = new Date(filters.date);
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      return <span className="badge bg-success">Aujourd'hui: {selectedDate.toLocaleDateString('fr-FR')}</span>;
    } else if (selectedDate < currentDate) {
      return (
        <span
          className="badge"
          style={{ backgroundColor: '#f4e7b2', color: '#5a4a0a', fontSize: '0.72rem' }}
        >
          Date passée: {selectedDate.toLocaleDateString('fr-FR')}
        </span>
      );
    } else {
      return <span className="badge bg-danger">Date future: {selectedDate.toLocaleDateString('fr-FR')}</span>;
    }
  };

  // ================== FIX SCROLL DatePicker ==================
  const lockScroll = () => { document.body.style.overflow = 'hidden'; };
  const unlockScroll = () => { document.body.style.overflow = ''; };

  const setToday = () => {
    setQuickRange('today');
    setFilters({ ...filters, date: new Date().toISOString().split('T')[0] });
  };
  const setYesterday = () => {
    setQuickRange('yesterday');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setFilters({ ...filters, date: yesterday.toISOString().split('T')[0] });
  };
  const setLastWeek = () => {
    setQuickRange('lastWeek');
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    setFilters({ ...filters, date: lastWeek.toISOString().split('T')[0] });
  };

  // ================== API CALLS ==================
  const fetchDailySummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reports/summary', { params: { date: filters.date } });
      setDailySummary(res.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de récupérer le résumé journalier.");
    } finally {
      setLoading(false);
    }
  }, [filters.date]);

  const fetchWeeklySummary = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/reports/weeklysummary');
      setWeeklySummary(res.data);

      setWeekData({
        labels: res.data.map(item => item.day),
        datasets: [
          { label: 'Entrées', data: res.data.map(i => i.in), backgroundColor: 'rgba(75,192,192,0.5)' },
          { label: 'Dépenses', data: res.data.map(i => i.out), backgroundColor: 'rgba(255,99,132,0.5)' },
        ],
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de récupérer les données hebdomadaires.");
    }
  }, []);

  const fetchMonthlySummary = useCallback(async () => {
    try {
      const today = new Date(filters.date);

      const res = await api.get('/reports/monthly', { 
        params: { month: today.getMonth() + 1, year: today.getFullYear() } 
      });
      setMonthlySummary(res.data);

      const graphRes = await api.get('/reports/graph/monthly', { 
        params: { year: today.getFullYear() } 
      });

      const monthNames = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

      const revenus = Array(12).fill(0);
      const depenses = Array(12).fill(0);

      graphRes.data.forEach(i => {
        const idx = i.month - 1;
        revenus[idx] = i.income || 0;
        depenses[idx] = i.expenses || 0;
      });

      setMonthData({
        labels: monthNames,
        datasets: [
          { label: 'Revenus', data: revenus, backgroundColor: 'rgba(54,162,235,0.5)' },
          { label: 'Dépenses', data: depenses, backgroundColor: 'rgba(255,99,132,0.5)' },
        ],
      });
    } catch (err) {
      console.error("Erreur fetchMonthlySummary:", err);
    }
  }, [filters.date]);

  const fetchAnnualSummary = useCallback(async () => {
    try {
      const today = new Date(filters.date);

      const res = await api.get('/reports/annual', { params: { year: today.getFullYear() } });
      setAnnualSummary(res.data);

      const graphRes = await api.get('/reports/graph/annual');

      setAnnualData({
        labels: graphRes.data.map(i => i.year.toString()),
        datasets: [
          { label: 'Revenus', data: graphRes.data.map(i => i.income), backgroundColor: 'rgba(153,102,255,0.5)' },
          { label: 'Dépenses', data: graphRes.data.map(i => i.expenses), backgroundColor: 'rgba(255,159,64,0.5)' },
        ],
      });
    } catch (err) {
      console.error("Erreur fetchAnnualSummary:", err);
    }
  }, [filters.date]);

  useEffect(() => {
    fetchDailySummary();
    fetchWeeklySummary();
    fetchMonthlySummary();
    fetchAnnualSummary();
  }, [fetchDailySummary, fetchWeeklySummary, fetchMonthlySummary, fetchAnnualSummary]);

  // Nettoyage sécurité : déverrouillee le scroll si le composant est démonté
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ================== EXPORTS ==================
  const exportDailyPDF = async () => {
    try {
      const response = await api.get(`/reports/export/daily?date=${filters.date}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `releve-journalier-${filters.date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur export PDF quotidien :", err);
      alert("Impossible de télécharger le PDF quotidien.");
    }
  };

  const exportWeeklyPDF = async () => {
    try {
      const response = await api.get(`/reports/export/weekly?mode=${weeklyPdfMode}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `releve-hebdomadaire.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur export PDF hebdo :", err);
      alert("Impossible de télécharger le PDF hebdomadaire.");
    }
  };

  const exportMonthlyPDF = async () => {
    try {
      const today = new Date(filters.date);
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const response = await api.get(`/reports/export/monthly?month=${month}&year=${year}&mode=${monthlyPdfMode}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `releve-mensuel-${month}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur export PDF mensuel :", err);
      alert("Impossible de télécharger le PDF mensuel.");
    }
  };

  const exportAnnualPDF = async () => {
    try {
      const year = new Date(filters.date).getFullYear();
      const response = await api.get(`/reports/export/annual?year=${year}&mode=${annualPdfMode}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `releve-annuel-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur export PDF annuel :", err);
      alert("Impossible de télécharger le PDF annuel.");
    }
  };

  const handlePdfExport = async () => {
    setShowPdfExportModal(false);
    try {
      for (const date of pdfExportDates) {
        let url = '';
        if (pdfExportType === 'day') {
          url = `/reports/export/daily?date=${date}`;
        } else if (pdfExportType === 'week') {
          url = `/reports/export/weekly?date=${date}`;
        } else if (pdfExportType === 'month') {
          const d = new Date(date);
          url = `/reports/export/monthly?month=${d.getMonth()+1}&year=${d.getFullYear()}`;
        } else if (pdfExportType === 'year') {
          const d = new Date(date);
          url = `/reports/export/annual?year=${d.getFullYear()}`;
        }
        const response = await api.get(url, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `rapport-${pdfExportType}-${date}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      alert('Erreur export PDF');
    }
  };

  const handleExportPDF = async () => {
    setShowExportModal(false);
    unlockScroll(); // sécurité : déverrouiller le scroll à la fermeture du modal
    try {
      let url = '';
      if (exportType === 'daily') {
        url = `/reports/export/daily?dates=${selectedDates.join(',')}&mode=details`;
      } else if (exportType === 'weekly') {
        url = `/reports/export/weekly?week=${selectedWeeks[0]}&mode=${exportFormat}`;
      } else if (exportType === 'monthly') {
        const d = new Date(selectedMonths[0]);
        url = `/reports/export/monthly?month=${d.getMonth()+1}&year=${d.getFullYear()}&mode=${exportFormat}`;
      } else if (exportType === 'annual') {
        url = `/reports/export/annual?year=${selectedYears[0]}&mode=${exportFormat}`;
      }
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-${exportType}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSelectedDates([]);
      setSelectedWeeks([]);
      setSelectedMonths([]);
      setSelectedYears([]);
      setExportType('daily');
      setExportFormat('summary');
    } catch (err) {
      alert('Erreur export PDF');
    }
  };

  // ================== CHART OPTIONS ==================
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true } },
    scales: { y: { beginAtZero: true } },
  };

  const hasChartData = (datasets = []) =>
    datasets.some((dataset) => (dataset.data || []).some((value) => Number(value || 0) > 0));

  const chartHasWeeklyData = hasChartData(weekData.datasets);
  const chartHasMonthlyData = hasChartData(monthData.datasets);
  const chartHasAnnualData = hasChartData(annualData.datasets);

  // ================== RENDER ==================
  return (
    <div className="dashboard-page p-3 p-md-4" style={{ backgroundColor: '#f9fafc', minHeight: '100vh' }}>
      <h1 className="h2 mb-3">Tableau de bord Admin</h1>

      <div className="sticky-top py-2" style={{ backgroundColor: '#f9fafc', zIndex: 1010 }}>
        <div className="d-flex flex-column gap-2 mb-2">
          <Filters filters={filters} setFilters={setFilters} />
          <div className="row g-2" role="group" aria-label="Période rapide">
            <div className="col-12 col-md-4">
              <button onClick={setToday} className={`btn btn-sm py-2 w-100 ${quickRange === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}><FaCalendarAlt /> Aujourd'hui</button>
            </div>
            <div className="col-12 col-md-4">
              <button onClick={setYesterday} className={`btn btn-sm py-2 w-100 ${quickRange === 'yesterday' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}><FaCalendarAlt /> Hier</button>
            </div>
            <div className="col-12 col-md-4">
              <button onClick={setLastWeek} className={`btn btn-sm py-2 w-100 ${quickRange === 'lastWeek' ? 'btn-info text-dark' : 'btn-outline-info'}`}><FaCalendarAlt /> Semaine passée</button>
            </div>
          </div>
          {loading && <div className="small text-muted">Mise à jour des données...</div>}
        </div>
      </div>

      <div className="mb-3">{getDateBadge()}</div>
      {loading && <div className="alert alert-info">Chargement en cours...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* ================= Résumé Journalier ================= */}    

  {/* Desktop / PC (lg+) */}
  <div className="row g-2 mb-4 d-none d-lg-flex">
    <div className="col-lg-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-primary d-flex flex-column h-100">
        <div className="small">⚙ Heure</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.hourIncome || 0}</div>
      </div>
    </div>

    <div className="col-lg-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-info d-flex flex-column h-100">
        <div className="small">🌙 Nuitée</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.nightIncome || 0}</div>
      </div>
    </div>

    <div className="col-lg-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-secondary d-flex flex-column h-100">
        <div className="small">☀ Journée</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.entriesIncome || 0}</div>
      </div>
    </div>

    <div className="col-lg-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-primary d-flex flex-column h-100">
        <div className="small">💰 Total</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.totalIncome || 0}</div>
      </div>
    </div>

    <div className="col-lg-2">
      <div
        className="kpi-card p-2 text-white rounded shadow-sm bg-danger d-flex flex-column h-100"
        role="button"
        onClick={() => (window.location.hash = '#expense-form')}
        style={{ cursor: 'pointer' }}
        aria-label="Aller au formulaire de dépense"
      >
        <div className="small">💸 Dépenses</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.totalExpenses || 0}</div>
      </div>
    </div>

    <div className="col-lg-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-success d-flex flex-column h-100">
        <div className="small"><FaBalanceScale /> Solde</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.remaining || 0}</div>
        <div className="small opacity-75 mt-1">Revenus – Dépenses</div>
      </div>
    </div>
  </div>

  {/* Mobile (xs/md) */}
  <div className="row g-2 mb-4 d-lg-none">
    <div className="col-6">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-primary d-flex flex-column h-100">
        <div className="small">⚙ Heure</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.hourIncome || 0}</div>
      </div>
    </div>

    <div className="col-6">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-info d-flex flex-column h-100">
        <div className="small">🌙 Nuitée</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.nightIncome || 0}</div>
      </div>
    </div>

    <div className="col-12">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-secondary d-flex flex-column">
        <div className="small">☀ Journée</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.entriesIncome || 0}</div>
      </div>
    </div>

    <div className="col-6 d-flex flex-column gap-2">
      <div className="kpi-card p-2 text-white rounded shadow-sm bg-primary d-flex flex-column h-100">
        <div className="small">💰 Total</div>
        <div className="fw-bold fs-6 mt-1">
          {dailySummary.totalIncome || 0}
        </div>
      </div>

      <div className="kpi-card p-2 text-white rounded shadow-sm bg-success d-flex flex-column h-100">
        <div className="small">
          <FaBalanceScale /> Solde
        </div>
        <div className="fw-bold fs-6 mt-1">
          {dailySummary.remaining || 0}
        </div>
        <div className="small opacity-75 mt-1">
          Revenus – Dépenses
        </div>
      </div>
    </div>

    <div className="col-6">
      <div
        className="kpi-card p-2 text-white rounded shadow-sm bg-danger d-flex flex-column h-100"
        role="button"
        onClick={() => (window.location.hash = '#expense-form')}
        style={{ cursor: 'pointer', minHeight: 110 }}
        aria-label="Aller au formulaire de dépense"
      >
        <div className="small">💸 Dépenses</div>
        <div className="fw-bold fs-6 mt-1">{dailySummary.totalExpenses || 0}</div>
        <div className="small opacity-75">période sélectionnée</div>

        <button
          type="button"
          className="btn btn-light btn-sm fw-semibold mt-auto"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          onClick={(event) => {
            event.stopPropagation();
            window.location.hash = '#expense-form';
          }}
        >
          ➕ Dépense
        </button>
      </div>
    </div>
  </div>

        <div className="d-lg-none mb-3">
          <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => setShowAllKpis((prev) => !prev)}>
            {showAllKpis ? 'Masquer des indicateurs' : 'Voir tous les indicateurs'}
          </button>
        </div>

        <StayList filters={filters} setFilters={setFilters} />
        <ExpenseList filters={filters} />

        {/* Actions */}
        {/* Bouton Export PDF flottant desktop (web) */}
        <button
          type="button"
          className="btn btn-success d-none d-lg-block position-fixed"
          style={{ right: 16, bottom: 16, zIndex: 1030, borderRadius: 999 }}
          onClick={() => setShowExportModal(true)}
        >
          📄 Export PDF
        </button>

        {/* Graphiques */}
        <div className="mt-4">
          <div className="bg-white rounded shadow-sm border mb-3">
            <details open>
              <summary
                className="dashboard-toggle px-3 py-2 fw-semibold"
                style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
              >
                <FaChartBar /> Graphique Hebdomadaire
              </summary>
              <div className="px-3 pb-3">
                <p className="mb-2 small">
                  Total revenus {weeklySummary.reduce((sum, i) => sum + (i.in || 0), 0)} - Dépenses {weeklySummary.reduce((sum, i) => sum + (i.out || 0), 0)} - Solde {weeklySummary.reduce((sum, i) => sum + (i.in || 0) - (i.out || 0), 0)}
                </p>
                {!chartHasWeeklyData ? (
                  <div className="alert alert-light border mb-0">
                    <p className="mb-2">Pas assez de données pour afficher le graphique.</p>
                    <p className="small text-muted mb-2">Ajoutez au moins une dépense ou un séjour pour voir l'évolution.</p>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => window.location.hash = '#expense-form'}>Ajouter une dépense</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={setLastWeek}>Changer la période</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 520 }}>
                      <Bar data={weekData} options={{ ...chartOptions, title: { text: "Entrées / Dépenses de la Semaine" } }} />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="bg-white rounded shadow-sm border mb-3">
            <details>
              <summary
                className="dashboard-toggle px-3 py-2 fw-semibold"
                style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
              >
                <FaChartBar /> Graphique Mensuel
              </summary>
              <div className="px-3 pb-3">
                <p className="mb-2 small">Total revenus {monthlySummary.income || 0} - Dépenses {monthlySummary.expenses || 0} - Solde {monthlySummary.remaining || 0}</p>
                {!chartHasMonthlyData ? (
                  <div className="alert alert-light border mb-0">
                    <p className="mb-2">Pas assez de données pour afficher le graphique.</p>
                    <p className="small text-muted mb-2">Ajoutez au moins une dépense ou un séjour pour voir l'évolution.</p>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => window.location.hash = '#expense-form'}>Ajouter une dépense</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={setLastWeek}>Changer la période</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 520 }}>
                      <Bar data={monthData} options={{ ...chartOptions, title: { text: "Revenus / Dépenses Mensuels" } }} />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="bg-white rounded shadow-sm border">
            <details>
              <summary
                className="dashboard-toggle px-3 py-2 fw-semibold"
                style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
              >
                <FaChartBar /> Graphique Annuel
              </summary>
              <div className="px-3 pb-3">
                <p className="mb-2 small">Total revenus {annualSummary.income || 0} - Dépenses {annualSummary.expenses || 0} - Solde {annualSummary.remaining || 0}</p>
                {!chartHasAnnualData ? (
                  <div className="alert alert-light border mb-0">
                    <p className="mb-2">Pas assez de données pour afficher le graphique.</p>
                    <p className="small text-muted mb-2">Ajoutez au moins une dépense ou un séjour pour voir l'évolution.</p>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => window.location.hash = '#expense-form'}>Ajouter une dépense</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={setLastWeek}>Changer la période</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 520 }}>
                      <Bar data={annualData} options={{ ...chartOptions, title: { text: "Revenus / Dépenses Annuels" } }} />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Bouton Export PDF flottant mobile */}
        <button
          type="button"
          className="btn btn-success d-lg-none position-fixed"
          style={{ left: 16, bottom: 16, zIndex: 1030, borderRadius: 999 }}
          onClick={() => setShowExportModal(true)}
        >
          📄 Export PDF
        </button>

        <button
          type="button"
          className="btn btn-primary d-lg-none position-fixed"
          style={{ right: 16, bottom: 16, zIndex: 1030, borderRadius: 999 }}
          onClick={() => window.location.hash = '#expense-form'}
        >
          ➕ Dépense
        </button>

        {/* ================== Modal Export PDF ================== */}
        {showExportModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Exporter un rapport PDF</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => { setShowExportModal(false); unlockScroll(); }}
                  ></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">Sélectionnez le format :</label>
                  <select className="form-select mb-3" value={exportType} onChange={e => setExportType(e.target.value)}>
                    <option value="daily">Jour(s)</option>
                  </select>

                  {(exportType === 'weekly' || exportType === 'monthly' || exportType === 'annual') && (
                    <div className="mb-3">
                      <label className="form-label">Format du rapport :</label>
                      <select className="form-select" value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                        <option value="summary">Résumé</option>
                        <option value="details">Détails</option>
                        <option value="both">Les deux</option>
                      </select>
                    </div>
                  )}

                  <label className="form-label">Choisissez la/les date(s) :</label>

                  {/* ===== FIX SCROLL : wrapper + fixMainPosition + lock/unlock ===== */}
                  {exportType === 'daily' && (
                    <div
                      onWheel={e => e.stopPropagation()}
                      onTouchMove={e => e.stopPropagation()}
                    >
                      <DatePicker
                        multiple
                        value={selectedDates}
                        onChange={dates => setSelectedDates(dates.map(d => d.format("YYYY-MM-DD")))}
                        format="YYYY-MM-DD"
                        fixMainPosition
                        onOpen={lockScroll}
                        onClose={unlockScroll}
                        className="mb-2"
                      />
                    </div>
                  )}

                  {exportType === 'weekly' && (
                    <DatePicker
                      multiple
                      stayOpen
                      value={selectedWeeks}
                      onChange={weeks => setSelectedWeeks(weeks.map(w => w.format('YYYY-[W]WW')))}
                      format="YYYY-[W]WW"
                      weekPicker
                      className="mb-2"
                      fixMainPosition
                      locale="fr"
                    />
                  )}
                  {exportType === 'monthly' && (
                    <input
                      type="month"
                      className="form-control mb-2"
                      value={selectedMonths[0] || ''}
                      onChange={e => setSelectedMonths([e.target.value])}
                    />
                  )}
                  {exportType === 'annual' && (
                    <select
                      className="form-select mb-2"
                      multiple
                      value={selectedYears}
                      onChange={e => setSelectedYears(Array.from(e.target.selectedOptions, o => o.value))}
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={2026 - i}>{2026 - i}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowExportModal(false); unlockScroll(); }}
                  >
                    Annuler
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleExportPDF}>
                    Exporter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Dashboard;