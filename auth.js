console.log('auth.js loaded');

(function() {
  const currentUser = window.api?.getCurrentUser();
  if (currentUser && (location.pathname.includes('login.html') || location.pathname.includes('register.html') || location.pathname.includes('forgot-password.html') || location.pathname.includes('reset-password.html'))) {
    console.log('User already logged in, redirecting to dashboard');
    location.href = 'dashboard.html';
    return;
  }
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    console.log('Login form found, attaching event listener');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      console.log('Email:', email);
      try {
        const data = await window.api.login(email, password);
        console.log('Login success:', data);
        Utils.showToast('Login successful!', 'success');
        setTimeout(() => location.href = 'dashboard.html', 500);
      } catch (err) {
        console.error('Login error:', err);
        Utils.showToast(err.message, 'error');
      }
    });
  } else {
    console.error('Login form not found');
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    console.log('Register form found, attaching event listener');
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Register form submitted');
      const fullname = document.getElementById('fullname').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;
      if (password !== confirm) {
        Utils.showToast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        Utils.showToast('Password min 6 characters', 'error');
        return;
      }
      try {
        const data = await window.api.register({ fullname, email, password });
        console.log('Register success:', data);
        Utils.showToast('Registration successful!', 'success');
        setTimeout(() => location.href = 'dashboard.html', 1500);
      } catch (err) {
        console.error('Register error:', err);
        Utils.showToast(err.message, 'error');
      }
    });
  } else {
    console.error('Register form not found');
  }
})();