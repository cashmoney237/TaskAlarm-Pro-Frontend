(function() {
  const currentUser = window.api.getCurrentUser();
  if (currentUser && (location.pathname.includes('login.html') || location.pathname.includes('register.html') || location.pathname.includes('forgot-password.html') || location.pathname.includes('reset-password.html'))) {
    location.href = 'dashboard.html';
    return;
  }
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await window.api.login(email, password);
        Utils.showToast('Login successful!', 'success');
        setTimeout(() => location.href = 'dashboard.html', 500);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    });
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullname = document.getElementById('fullname').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;
      if (password !== confirm) return Utils.showToast('Passwords do not match', 'error');
      if (password.length < 6) return Utils.showToast('Password min 6 characters', 'error');
      try {
        await window.api.register({ fullname, email, password });
        Utils.showToast('Registration successful!', 'success');
        setTimeout(() => location.href = 'login.html', 1500);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    });
  }
  
  // Forgot password
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmail').value;
      try {
        await window.api.forgotPassword(email);
        Utils.showToast('Reset link sent to your email', 'success');
        setTimeout(() => location.href = 'login.html', 3000);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    });
  }
  
  // Reset password
  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (!token) {
      const errDiv = document.getElementById('tokenError');
      if (errDiv) { errDiv.style.display = 'block'; errDiv.textContent = 'No reset token provided.'; }
      if (resetForm.querySelector('button')) resetForm.querySelector('button').disabled = true;
    }
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmPassword').value;
      if (newPassword.length < 6) return Utils.showToast('Password min 6 characters', 'error');
      if (newPassword !== confirm) return Utils.showToast('Passwords do not match', 'error');
      try {
        await window.api.resetPassword(token, newPassword);
        Utils.showToast('Password reset successful! Please login.', 'success');
        setTimeout(() => location.href = 'login.html', 2000);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    });
  }
})();