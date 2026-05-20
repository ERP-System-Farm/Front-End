import api from '../../services/api';

export const getFinancialSummary = async () => (await api.get('accounting/summary')).data;
export const getExpenses = async () => (await api.get('accounting/expenses')).data;
export const createExpense = async (data) => (await api.post('accounting/expenses', data)).data;
export const getRevenues = async () => (await api.get('accounting/revenues')).data;
export const createRevenue = async (data) => (await api.post('accounting/revenues', data)).data;
export const getSalaries = async () => (await api.get('accounting/salaries')).data;
export const createSalary = async (data) => (await api.post('accounting/salaries', data)).data;

export const getInvoices = async () => (await api.get('accounting/invoices')).data;
export const getInvoiceDetails = async (id) => (await api.get(`accounting/invoices/${id}`)).data;
export const createInvoice = async (data) => (await api.post('accounting/invoices', data)).data;
export const updateInvoiceStatus = async (id, status) => (await api.patch(`accounting/invoices/${id}`, { status })).data;
