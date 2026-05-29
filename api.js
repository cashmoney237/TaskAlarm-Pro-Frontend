console.log('api.js loaded');

// ✅ Use your actual Render backend URL (the one that was working before)
const API_URL = 'https://elumbemikelawrce.onrender.com/api';

let authToken = localStorage.getItem('token');

async function apiRequest(endpoint, method, body = null) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  console.log(`API Request: ${method} ${url}`, body);
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
  if (!response.ok) {
    let errorMsg;
    try {
      const error = await response.json();
      errorMsg = error.error || `HTTP ${response.status}`;
    } catch (e) { errorMsg = `HTTP ${response.status}`; }
    throw new Error(errorMsg);
  }
  return response.json();
}

async function apiRegister(userData) {
  const data = await apiRequest('/auth/register', 'POST', userData);
  if (data.token) {
    authToken = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', 'POST', { email, password });
  if (data.token) {
    authToken = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

function apiLogout() {
  authToken = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

async function apiGetTasks() { return apiRequest('/tasks', 'GET'); }
async function apiCreateTask(task) { return apiRequest('/tasks', 'POST', task); }
async function apiUpdateTask(taskId, updates) { return apiRequest(`/tasks/${taskId}`, 'PUT', updates); }
async function apiDeleteTask(taskId) { return apiRequest(`/tasks/${taskId}`, 'DELETE'); }

async function apiForgotPassword(email) { return apiRequest('/auth/forgot-password', 'POST', { email }); }
async function apiResetPassword(token, newPassword) { return apiRequest('/auth/reset-password', 'POST', { token, newPassword }); }

function getEmails() {
  const user = getCurrentUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem(`emails_${user.id}`) || '[]');
}
function addEmail(email) {
  const user = getCurrentUser();
  if (!user) return;
  const emails = getEmails();
  emails.push({ ...email, timestamp: new Date().toISOString() });
  localStorage.setItem(`emails_${user.id}`, JSON.stringify(emails));
}
function deleteEmail(timestamp) {
  const user = getCurrentUser();
  if (!user) return;
  let emails = getEmails();
  emails = emails.filter(e => e.timestamp !== timestamp);
  localStorage.setItem(`emails_${user.id}`, JSON.stringify(emails));
}
function clearAllEmails() {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(`emails_${user.id}`, JSON.stringify([]));
}

window.api = {
  register: apiRegister,
  login: apiLogin,
  logout: apiLogout,
  getCurrentUser,
  getTasks: apiGetTasks,
  createTask: apiCreateTask,
  updateTask: apiUpdateTask,
  deleteTask: apiDeleteTask,
  forgotPassword: apiForgotPassword,
  resetPassword: apiResetPassword,
  getEmails, addEmail, deleteEmail, clearAllEmails
};