import api from './api';

export const exportMonthlyPDF = async (month, year, mode = 'both') => {
  const response = await api.get(`/report/exportMonthlyPDF`, {
    params: { month, year, mode },
    responseType: 'blob',
  });
  return response.data;
};

export const exportAnnualPDF = async (year, mode = 'both') => {
  const response = await api.get(`/report/exportAnnualPDF`, {
    params: { year, mode },
    responseType: 'blob',
  });
  return response.data;
};

// Utilisation :
// const pdfBlob = await exportMonthlyPDF(3, 2026, 'details');
// const pdfBlob = await exportAnnualPDF(2026, 'summary');
