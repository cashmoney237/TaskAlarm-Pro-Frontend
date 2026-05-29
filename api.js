const API_URL = 'https://elumbemikelawrce.onrender.com/api';
let authToken = localStorage.getItem('token');

async function apiRequest(endpoint, method, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
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

// Email history (localStorage)
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