const Utils = {
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: '🔔' };
    toast.innerHTML = `<i>${icons[type] || 'ℹ️'}</i><div class="toast-content">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
  formatDate(date) {
    return new Date(date).toLocaleString();
  },
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  },
  generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
  }
};