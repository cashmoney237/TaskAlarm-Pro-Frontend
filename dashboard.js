(function() {
  const currentUser = window.api.getCurrentUser();
  if (!currentUser) { window.location.href = 'login.html'; return; }
  
  let tasks = [];
  let currentPage = 'tasks';
  let customRingtoneBlobUrl = null;
  let selectedAudioFile = null;
  
  // DOM elements
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const currentTimeEl = document.getElementById('currentTime');
  const pageTitle = document.getElementById('pageTitle');
  const taskForm = document.getElementById('taskForm');
  const tasksList = document.getElementById('tasksList');
  const activeAlarmsList = document.getElementById('activeAlarmsList');
  const completedTasksList = document.getElementById('completedTasksList');
  const missedTasksList = document.getElementById('missedTasksList');
  const emailsList = document.getElementById('emailsList');
  const pendingBadge = document.getElementById('pendingBadge');
  const alarmBadge = document.getElementById('alarmBadge');
  const completedBadge = document.getElementById('completedBadge');
  const missedBadge = document.getElementById('missedBadge');
  const emailBadge = document.getElementById('emailBadge');
  const refreshBtn = document.getElementById('refreshTasks');
  const clearAllEmailsBtn = document.getElementById('clearAllEmailsBtn');
  
  if (userName) userName.textContent = currentUser.fullname;
  if (userEmail) userEmail.textContent = currentUser.email;
  if (userAvatar) userAvatar.textContent = currentUser.fullname.charAt(0).toUpperCase();
  
  if (typeof AlarmSystem !== 'undefined') AlarmSystem.init(null);
  
  // Alarm checker (timestamp based)
  let lastLogTime = 0;
  function checkAlarms() {
    const now = Date.now();
    let triggered = false;
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (task.isCompleted || task.isMissed) continue;
      const taskTime = typeof task.scheduledTime === 'number' ? task.scheduledTime : new Date(task.scheduledTime).getTime();
      const diffMs = taskTime - now;
      if (!task.alarmTriggered && diffMs <= 3000) {
        triggered = true;
        task.alarmTriggered = true;
        console.log(`🔥 TRIGGER ALARM: "${task.title}"`);
        window.api.updateTask(task._id, { alarmTriggered: true }).catch(console.error);
        if (typeof AlarmSystem !== 'undefined') {
          AlarmSystem.sendEmailNotification(
            currentUser.email,
            currentUser.fullname,
            task.title,
            task.description,
            task.scheduledTime
          );
          AlarmSystem.startAlarmCycle(task, () => loadTasks());
        }
        Utils.showToast(`🔔 "${task.title}" is due!`, 'warning');
        break;
      }
    }
    if (triggered) loadTasks();
  }
  
  async function loadTasks() {
    try {
      tasks = await window.api.getTasks();
      renderCurrentPage();
      updateBadges();
    } catch (err) {
      console.error(err);
      Utils.showToast('Failed to load tasks', 'error');
    }
  }
  
  function updateBadges() {
    if (pendingBadge) pendingBadge.textContent = tasks.filter(t => !t.isCompleted && !t.isMissed).length;
    if (alarmBadge) alarmBadge.textContent = tasks.filter(t => !t.isCompleted && !t.isMissed && t.alarmTriggered === true).length;
    if (completedBadge) completedBadge.textContent = tasks.filter(t => t.isCompleted === true).length;
    if (missedBadge) missedBadge.textContent = tasks.filter(t => t.isMissed === true).length;
    if (emailBadge) emailBadge.textContent = window.api.getEmails().length;
  }
  
  // Render functions (unchanged)
  function renderTasksPage() {
    if (!tasksList) return;
    const pending = tasks.filter(t => !t.isCompleted && !t.isMissed).sort((a,b)=>a.scheduledTime - b.scheduledTime);
    if (!pending.length) {
      tasksList.innerHTML = '<div class="empty-state">✨ No pending tasks. Create one!</div>';
      return;
    }
    tasksList.innerHTML = pending.map(task => `
      <div class="task-card" data-task-id="${task._id}">
        <div class="task-info">
          <div class="task-title">${Utils.escapeHtml(task.title)}</div>
          <div class="task-time"><i class="fas fa-clock"></i> ${new Date(task.scheduledTime).toLocaleString()}</div>
          ${task.description ? `<div class="task-desc">${Utils.escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-complete" data-id="${task._id}"><i class="fas fa-check-circle"></i></button>
          <button class="btn-delete" data-id="${task._id}"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
    attachTaskButtons();
  }
  
  function attachTaskButtons() {
    document.querySelectorAll('.btn-complete').forEach(btn => {
      btn.onclick = () => window.completeTask(btn.getAttribute('data-id'));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = () => window.deleteTask(btn.getAttribute('data-id'));
    });
  }
  
  function renderAlarmsPage() {
    if (!activeAlarmsList) return;
    const active = tasks.filter(t => !t.isCompleted && !t.isMissed && t.alarmTriggered === true);
    if (!active.length) {
      activeAlarmsList.innerHTML = '<div class="empty-state">🔕 No active alarms</div>';
      return;
    }
    activeAlarmsList.innerHTML = active.map(task => `
      <div class="task-card alarm-ringing">
        <div class="task-info">
          <div class="task-title">🔔 ${Utils.escapeHtml(task.title)}</div>
          <div class="task-time">Alarm active - Complete to stop</div>
          ${task.description ? `<div class="task-desc">${Utils.escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-complete" data-id="${task._id}"><i class="fas fa-stop-circle"></i> Stop</button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('#alarmsPage .btn-complete').forEach(btn => {
      btn.onclick = () => window.completeTask(btn.getAttribute('data-id'));
    });
  }
  
  function renderCompletedPage() {
    if (!completedTasksList) return;
    const completed = tasks.filter(t => t.isCompleted === true);
    if (!completed.length) {
      completedTasksList.innerHTML = '<div class="empty-state">📋 No completed tasks</div>';
      return;
    }
    completedTasksList.innerHTML = completed.map(task => `
      <div class="task-card">
        <div class="task-info">
          <div class="task-title" style="text-decoration:line-through;opacity:0.7;">${Utils.escapeHtml(task.title)}</div>
          <div class="task-time"><i class="fas fa-calendar-check"></i> Completed • ${new Date(task.scheduledTime).toLocaleString()}</div>
          ${task.description ? `<div class="task-desc">${Utils.escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-delete" data-id="${task._id}"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('#completedPage .btn-delete').forEach(btn => {
      btn.onclick = () => window.deleteCompletedTask(btn.getAttribute('data-id'));
    });
  }
  
  function renderMissedPage() {
    if (!missedTasksList) return;
    const missed = tasks.filter(t => t.isMissed === true);
    if (!missed.length) {
      missedTasksList.innerHTML = '<div class="empty-state">⏳ No missed tasks</div>';
      return;
    }
    missedTasksList.innerHTML = missed.map(task => `
      <div class="task-card missed-task">
        <div class="task-info">
          <div class="task-title">⚠️ ${Utils.escapeHtml(task.title)}</div>
          <div class="task-time"><i class="fas fa-hourglass-end"></i> Missed • ${new Date(task.scheduledTime).toLocaleString()}</div>
          ${task.description ? `<div class="task-desc">${Utils.escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-delete" data-id="${task._id}"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('#missedPage .btn-delete').forEach(btn => {
      btn.onclick = () => window.deleteMissedTask(btn.getAttribute('data-id'));
    });
  }
  
  function renderEmailsPage() {
    if (!emailsList) return;
    const emails = window.api.getEmails();
    if (!emails.length) {
      emailsList.innerHTML = '<div class="empty-state">📧 No email history</div>';
      return;
    }
    emailsList.innerHTML = emails.slice().reverse().map(email => `
      <div class="email-card">
        <div class="email-subject"><i class="fas fa-envelope"></i> ${Utils.escapeHtml(email.subject)}</div>
        <div class="email-body">${Utils.escapeHtml(email.body)}</div>
        <div class="email-time">
          <i class="fas fa-clock"></i> ${Utils.formatDate(email.timestamp)}
          <button class="btn-delete-email" data-timestamp="${email.timestamp}" style="margin-left:12px; background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('.btn-delete-email').forEach(btn => {
      btn.onclick = () => window.deleteEmailEntry(btn.getAttribute('data-timestamp'));
    });
  }
  
  function renderCurrentPage() {
    if (currentPage === 'tasks') renderTasksPage();
    else if (currentPage === 'alarms') renderAlarmsPage();
    else if (currentPage === 'completed') renderCompletedPage();
    else if (currentPage === 'missed') renderMissedPage();
    else if (currentPage === 'emails') renderEmailsPage();
  }
  
  // API actions
  window.deleteTask = async function(taskId) {
    if (!confirm('Delete this task permanently?')) return;
    try {
      await window.api.deleteTask(taskId);
      if (typeof AlarmSystem !== 'undefined') AlarmSystem.stopAlarm(taskId);
      await loadTasks();
      Utils.showToast('Task deleted', 'error');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };
  
  window.completeTask = async function(taskId) {
    try {
      await window.api.updateTask(taskId, { isCompleted: true, alarmTriggered: false });
      if (typeof AlarmSystem !== 'undefined') AlarmSystem.stopAlarm(taskId);
      await loadTasks();
      Utils.showToast('Task completed!', 'success');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };
  
  window.deleteCompletedTask = async function(taskId) {
    if (!confirm('Delete completed task?')) return;
    try {
      await window.api.deleteTask(taskId);
      await loadTasks();
      Utils.showToast('Task removed', 'error');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };
  
  window.deleteMissedTask = async function(taskId) {
    if (!confirm('Delete missed task?')) return;
    try {
      await window.api.deleteTask(taskId);
      await loadTasks();
      Utils.showToast('Missed task deleted', 'error');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };
  
  window.deleteEmailEntry = function(timestamp) {
    if (confirm('Delete this email record?')) {
      window.api.deleteEmail(timestamp);
      renderEmailsPage();
      updateBadges();
      Utils.showToast('Email deleted', 'error');
    }
  };
  
  // Create task (store as timestamp)
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value;
      const dateTimeStr = document.getElementById('taskDateTime').value;
      const description = document.getElementById('taskDesc').value;
      if (!title || !dateTimeStr) return Utils.showToast('Title and time required', 'error');
      const localDate = new Date(dateTimeStr);
      if (localDate <= new Date()) {
        Utils.showToast('Future time required', 'error');
        return;
      }
      const scheduledTime = localDate.getTime();
      try {
        await window.api.createTask({ title, description, scheduledTime });
        await loadTasks();
        taskForm.reset();
        Utils.showToast('Task created!', 'success');
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    });
  }
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (!page) return;
      currentPage = page;
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const pageElement = document.getElementById(`${page}Page`);
      if (pageElement) pageElement.classList.add('active');
      const titles = { tasks:'My Tasks', alarms:'Active Alarms', completed:'Completed Tasks', missed:'Missed Tasks', emails:'Email History' };
      if (pageTitle) pageTitle.textContent = titles[page] || 'TaskAlarm';
      renderCurrentPage();
    });
  });
  
  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof AlarmSystem !== 'undefined') AlarmSystem.stopAllAlarms();
      window.api.logout();
      window.location.href = 'login.html';
    });
  }
  
  // Mobile menu
  function closeSidebar() { if (sidebar) sidebar.classList.remove('mobile-open'); }
  if (mobileMenuBtn && sidebar) mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('mobile-open'));
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  document.addEventListener('click', (e) => {
    if (sidebar && mobileMenuBtn && sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) closeSidebar();
  });
  
  // Refresh & clear emails
  if (refreshBtn) refreshBtn.addEventListener('click', () => { loadTasks(); Utils.showToast('Refreshed', 'info'); });
  if (clearAllEmailsBtn) {
    clearAllEmailsBtn.addEventListener('click', () => {
      if (confirm('Delete ALL email history?')) {
        window.api.clearAllEmails();
        renderEmailsPage();
        updateBadges();
        Utils.showToast('All email history cleared', 'error');
      }
    });
  }
  
  // Clock
  function updateTime() { if (currentTimeEl) currentTimeEl.textContent = new Date().toLocaleString(); }
  updateTime();
  setInterval(updateTime, 1000);
  
  // Ringtone modal (unchanged)
  const ringtoneBtn = document.getElementById('ringtoneSettingsBtn');
  const modal = document.getElementById('ringtoneModal');
  const ringtoneFile = document.getElementById('ringtoneFileInput');
  const playPreview = document.getElementById('playPreviewBtn');
  const stopPreview = document.getElementById('stopPreviewBtn');
  const saveRingtone = document.getElementById('saveRingtoneBtn');
  const closeModal = document.getElementById('closeModalBtn');
  const currentRingtoneLabel = document.getElementById('currentRingtoneLabel');
  let previewAudio = null;
  
  function updateRingtoneDisplay() {
    if (currentRingtoneLabel) {
      currentRingtoneLabel.innerText = customRingtoneBlobUrl ? 'Custom ringtone (until refresh)' : 'Default beep';
    }
  }
  
  if (ringtoneBtn) {
    ringtoneBtn.onclick = () => {
      if (modal) modal.style.display = 'flex';
      updateRingtoneDisplay();
    };
  }
  if (closeModal) {
    closeModal.onclick = () => {
      if (previewAudio) previewAudio.pause();
      if (modal) modal.style.display = 'none';
    };
  }
  if (ringtoneFile) {
    ringtoneFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('audio/')) {
        Utils.showToast('Please select an audio file (MP3, WAV, etc.)', 'error');
        ringtoneFile.value = '';
        return;
      }
      selectedAudioFile = file;
      if (currentRingtoneLabel) currentRingtoneLabel.innerText = file.name;
      if (previewAudio) previewAudio.pause();
      const tempUrl = URL.createObjectURL(file);
      previewAudio = new Audio(tempUrl);
    };
  }
  if (playPreview) {
    playPreview.onclick = () => {
      if (previewAudio) {
        previewAudio.play();
      } else if (selectedAudioFile) {
        const tempUrl = URL.createObjectURL(selectedAudioFile);
        previewAudio = new Audio(tempUrl);
        previewAudio.play();
      } else {
        Utils.showToast('Select a ringtone file first', 'warning');
      }
    };
  }
  if (stopPreview) {
    stopPreview.onclick = () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
    };
  }
  if (saveRingtone) {
    saveRingtone.onclick = () => {
      if (!selectedAudioFile) {
        Utils.showToast('No audio file selected', 'error');
        return;
      }
      if (customRingtoneBlobUrl) URL.revokeObjectURL(customRingtoneBlobUrl);
      customRingtoneBlobUrl = URL.createObjectURL(selectedAudioFile);
      if (typeof AlarmSystem !== 'undefined') {
        AlarmSystem.updateRingtoneSource(customRingtoneBlobUrl);
      }
      Utils.showToast('Ringtone saved successfully', 'success');
      if (modal) modal.style.display = 'none';
      updateRingtoneDisplay();
    };
  }
  window.addEventListener('click', (e) => {
    if (modal && e.target === modal) modal.style.display = 'none';
  });
  updateRingtoneDisplay();
  
  // Start alarm checker
  if (typeof AlarmSystem !== 'undefined') {
    AlarmSystem.startChecker(() => {
      checkAlarms();
      updateBadges();
      if (currentPage === 'alarms') renderAlarmsPage();
    });
  }
  
  loadTasks();
})();