const API_URL = 'http://localhost/TaskAlarm-Backend';

let authToken = localStorage.getItem('token');

async function apiRequest(endpoint, method, body = null) {
    // Append token as query parameter if it exists
    let url = `${API_URL}/${endpoint}`;
    if (authToken && method !== 'POST') {
        // For GET, PUT, DELETE – add token to query string
        url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(authToken)}`;
    }
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`; // keep for compatibility
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    // For POST requests, also add token inside body if needed
    if (method === 'POST' && authToken && body) {
        body.token = authToken; // add token to body (backup)
        options.body = JSON.stringify(body);
    }
    console.log(`API Request: ${method} ${url}`);
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

async function apiRegister(userData) {
    const data = await apiRequest('register.php', 'POST', userData);
    if (data.token) {
        authToken = data.token;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
}

async function apiLogin(email, password) {
    const data = await apiRequest('login.php', 'POST', { email, password });
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

async function apiGetTasks() {
    return apiRequest('get_tasks.php', 'GET');
}

async function apiCreateTask(task) {
    return apiRequest('create_task.php', 'POST', task);
}

async function apiUpdateTask(taskId, updates) {
    return apiRequest(`update_task.php?id=${taskId}`, 'PUT', updates);
}

async function apiDeleteTask(taskId) {
    return apiRequest(`delete_task.php?id=${taskId}`, 'DELETE');
}

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
    getEmails, addEmail, deleteEmail, clearAllEmails
};