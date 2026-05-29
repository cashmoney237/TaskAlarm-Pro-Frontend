const AlarmSystem = {
  activeAlarms: new Map(),
  audio: null,
  checkerInterval: null,
  audioEnabled: false,
  currentRingtoneUrl: null,
  audioContext: null,
  beepInterval: null,
  useCustomRingtone: false,

  init(userRingtoneUrl = null) {
    this.useCustomRingtone = !!userRingtoneUrl;
    this.currentRingtoneUrl = userRingtoneUrl;
    this.setupAudio();
    const enableAudio = () => {
      if (this.audio && this.audio.src) {
        this.audio.play().then(() => {
          this.audio.pause();
          this.audio.currentTime = 0;
          this.audioEnabled = true;
        }).catch(e => console.warn('Audio enable failed:', e));
      } else {
        this.audioEnabled = true;
      }
      document.body.removeEventListener('click', enableAudio);
      document.body.removeEventListener('touchstart', enableAudio);
    };
    document.body.addEventListener('click', enableAudio);
    document.body.addEventListener('touchstart', enableAudio);
  },

  setupAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.useCustomRingtone && this.currentRingtoneUrl) {
      this.audio = new Audio();
      this.audio.src = this.currentRingtoneUrl;
      this.audio.load();
      this.audio.loop = true;
      this.audio.onerror = () => {
        console.warn('Custom ringtone failed, fallback to beep');
        this.useCustomRingtone = false;
        this.audio = null;
      };
    } else {
      this.audio = null;
    }
  },

  playSound() {
    if (!this.audioEnabled) return false;
    if (this.beepInterval) clearInterval(this.beepInterval);
    if (this.audio && this.audio.src) {
      this.audio.currentTime = 0;
      this.audio.play().catch(e => {
        console.warn('Custom ringtone play failed, using beep');
        this.startBeepLoop();
      });
    } else {
      this.startBeepLoop();
    }
    return true;
  },

  startBeepLoop() {
    this.beepInterval = setInterval(() => {
      this.playBeep();
    }, 1500);
    this.playBeep();
  },

  playBeep() {
    if (!this.audioEnabled) return;
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this.audioContext;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  },

  stopSound() {
    if (this.beepInterval) {
      clearInterval(this.beepInterval);
      this.beepInterval = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  },

  updateRingtoneSource(url) {
    if (!url) {
      this.useCustomRingtone = false;
      this.currentRingtoneUrl = null;
      this.setupAudio();
      return;
    }
    this.currentRingtoneUrl = url;
    this.useCustomRingtone = true;
    this.setupAudio();
    if (this.audio) {
      this.audio.play().then(() => {
        this.audio.pause();
        this.audio.currentTime = 0;
        console.log('Custom ringtone loaded');
      }).catch(e => console.warn('Custom ringtone test failed', e));
    }
  },

  resetToDefault() {
    this.useCustomRingtone = false;
    this.currentRingtoneUrl = null;
    this.setupAudio();
    console.log('Ringtone reset to default beep');
  },

  startAlarmCycle(task, onStop) {
    if (task.isCompleted) return null;
    if (this.activeAlarms.has(task.id)) this.stopAlarm(task.id);
    let isActive = true;
    let stopTimeout = null;
    const stopAlarmCallback = () => {
      if (!isActive) return;
      isActive = false;
      this.stopSound();
      if (stopTimeout) clearTimeout(stopTimeout);
      const card = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
      if (card) card.classList.remove('alarm-ringing');
      this.activeAlarms.delete(task.id);
      if (onStop) onStop(task.id);
      this.resetToDefault();
    };
    this.playSound();
    Utils.showToast(`🔔 "${task.title}" is due!`, 'warning');
    const taskCard = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
    if (taskCard) taskCard.classList.add('alarm-ringing');
    stopTimeout = setTimeout(() => {
      if (isActive) stopAlarmCallback();
    }, 60000);
    this.activeAlarms.set(task.id, { stop: stopAlarmCallback });
    return stopAlarmCallback;
  },

  stopAlarm(taskId) {
    const alarm = this.activeAlarms.get(taskId);
    if (alarm) alarm.stop();
    this.activeAlarms.delete(taskId);
    this.stopSound();
    this.resetToDefault();
  },

  stopAllAlarms() {
    this.activeAlarms.forEach(alarm => alarm.stop());
    this.activeAlarms.clear();
    this.stopSound();
    this.resetToDefault();
  },

  // ✅ Email via EmailJS (with debug logs)
  sendEmailNotification(userEmail, userName, taskTitle, taskDescription, scheduledTime) {
    const formattedTime = new Date(scheduledTime).toLocaleString();
    console.log('📧 sendEmailNotification called');
    console.log('   to:', userEmail);
    console.log('   task:', taskTitle);
    
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
      console.error('❌ EmailJS not loaded! Check script tag in HTML.');
      return;
    }
    
    // Initialize EmailJS (public key)
    emailjs.init('koAqVQ3gTxbRn-QKI');
    console.log('📧 EmailJS initialized');
    
    // Send email
    emailjs.send('service_95zfcl8', 'template_5w0r0mg', {
      to_email: userEmail,
      to_name: userName,
      task_title: taskTitle,
      task_description: taskDescription || 'No description',
      task_time: formattedTime
    }).then(() => {
      console.log('✅ EmailJS: Email sent successfully to', userEmail);
      // Store in local history
      if (typeof addEmail !== 'undefined') {
        addEmail({
          to: userEmail,
          subject: `⏰ Task Reminder: ${taskTitle}`,
          body: `Hello ${userName},\n\nYour task "${taskTitle}" is due at ${formattedTime}.\nDescription: ${taskDescription || 'None'}`
        });
        console.log('📧 Email stored in local history');
      }
    }).catch(err => {
      console.error('❌ EmailJS error:', err);
    });
  },

  startChecker(callback) {
    if (this.checkerInterval) clearInterval(this.checkerInterval);
    this.checkerInterval = setInterval(callback, 1000);
  },

  stopChecker() {
    if (this.checkerInterval) clearInterval(this.checkerInterval);
    this.checkerInterval = null;
  }
};