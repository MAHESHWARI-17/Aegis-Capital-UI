import axios from 'axios';

const BASE = 'http://localhost:8090';

const api = axios.create({ baseURL: BASE });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── AUTH ────────────────────────────────────────────────────────
export const authAPI = {
  registerInit: (data) => api.post('/auth/register/init', data),
  registerVerifyOtp: (data) => api.post('/auth/register/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

// ─── ACCOUNTS ────────────────────────────────────────────────────
export const accountAPI = {
  getProfile: () => api.get('/accounts/profile'),
  addAccount: (data) => api.post('/accounts/add', data),
  requestPinOtp: (data) => api.post('/accounts/pin/request-otp', data),
  setPin: (data) => api.post('/accounts/pin/set', data),
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────
export const txnAPI = {
  deposit: (data) => api.post('/transactions/deposit', data),
  withdraw: (data) => api.post('/transactions/withdraw', data),
  transfer: (data) => api.post('/transactions/transfer', data),
  getStatement: (accountNumber, from, to) =>
    api.get(`/transactions/statement/${accountNumber}?from=${from}&to=${to}`),
  getByRef: (ref) => api.get(`/transactions/${ref}`),
  getRemaining: (accountNumber) => api.get(`/transactions/remaining/${accountNumber}`),
};

// ─── AUDIT ────────────────────────────────────────────────────────
export const auditAPI = {
  myTransactions: (accountNumber, from, to) =>
    api.get(`/audit/my-transactions?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  mySummary: (accountNumber, from, to) =>
    api.get(`/audit/summary?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  complianceTransactions: (accountNumber, from, to) =>
    api.get(`/audit/compliance/transactions?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  complianceSummary: (accountNumber, from, to) =>
    api.get(`/audit/compliance/summary?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  complianceByCustomer: (customerId, from, to) =>
    api.get(`/audit/compliance/user/${customerId}?from=${from}&to=${to}`),
};

// ─── COMPLIANCE ───────────────────────────────────────────────────
// register removed — compliance officers are now created by admin only
export const complianceAPI = {
  login: (data) => api.post('/compliance/login', data),
  setFirstPassword: (data) => api.post('/compliance/login/set-password', data),
  getAllUsers: () => api.get('/compliance/users'),
  getUserProfile: (customerId) => api.get(`/compliance/users/${customerId}`),
  freezeAccount: (data) => api.post('/compliance/accounts/freeze', data),
  unfreezeAccount: (data) => api.post('/compliance/accounts/unfreeze', data),
  lockUser: (customerId) => api.post(`/compliance/users/${customerId}/lock`),
  unlockUser: (customerId) => api.post(`/compliance/users/${customerId}/unlock`),
  deposit: (data) => api.post('/transactions/deposit', data),
};

// ─── ADMIN ────────────────────────────────────────────────────────
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  // Officer management — admin directly creates officers (no approval flow)
  addOfficer: (data) => api.post('/admin/officers/add', data),
  getAllOfficers: () => api.get('/admin/officers'),
  removeOfficer: (officerId) => api.delete(`/admin/officers/${officerId}`),
  reactivateOfficer: (officerId) => api.post(`/admin/officers/${officerId}/reactivate`),
  resendCredentials: (officerId) => api.post(`/admin/officers/${officerId}/resend-credentials`),
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserProfile: (customerId) => api.get(`/admin/users/${customerId}`),
  freezeAccount: (data) => api.post('/admin/accounts/freeze', data),
  unfreezeAccount: (data) => api.post('/admin/accounts/unfreeze', data),
  lockUser: (customerId) => api.post(`/admin/users/${customerId}/lock`),
  unlockUser: (customerId) => api.post(`/admin/users/${customerId}/unlock`),
  deposit: (data) => api.post('/transactions/deposit', data),
  // Audit
  complianceTransactions: (accountNumber, from, to) =>
    api.get(`/audit/compliance/transactions?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  complianceSummary: (accountNumber, from, to) =>
    api.get(`/audit/compliance/summary?accountNumber=${encodeURIComponent(accountNumber)}&from=${from}&to=${to}`),
  complianceByCustomer: (customerId, from, to) =>
    api.get(`/audit/compliance/user/${customerId}?from=${from}&to=${to}`),
};

export default api;
