const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V14.25c0-1.243-1.007-2.25-2.25-2.25h-5.25c-1.243 0-2.25 1.007-2.25 2.25v3.5m7.5 10.375h-9.75a.375.375 0 01-.375-.375V8.25a.375.375 0 01.375-.375h9.75a.375.375 0 01.375.375v9.375a.375.375 0 01-.375.375z" /></svg>`;
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;
const analyticsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 21v-7.875zM12.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM21 4.125C21 3.504 21.504 3 22.125 3h.375c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-.375A1.125 1.125 0 0121 21.875V4.125z" /></svg>`;
const refreshIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348A1.875 1.875 0 0014.19 7.5H13.5m-1.566 0A2.25 2.25 0 0010.5 9.75a2.25 2.25 0 002.25 2.25H15M9.912 21.75V19.5m0-4.5V12m0-3L8.25 4.5M6 15.75L4.72 17.03a3.375 3.375 0 000 4.74l.879.879H20.25M17.25 9.75L19.5 7.5m0 0l-2.25-2.25M22.5 10.5h-1.657a2.25 2.25 0 00-1.243.385l-1.144.763V4.5M10.5 15.75L11.75 14.5m0-4.5V7.5M10.5 4.5V3m0-3L8.25 4.5" /></svg>`;

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const otpView = document.getElementById('otp-view');
const forgotPasswordView = document.getElementById('forgot-password-view');
const resetPasswordView = document.getElementById('reset-password-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const otpForm = document.getElementById('otp-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const urlForm = document.getElementById('url-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const showForgotPasswordLink = document.getElementById('show-forgot-password');
const otpBackToLoginLink = document.getElementById('otp-back-to-login');
const forgotBackToLoginLink = document.getElementById('forgot-back-to-login');
const authResultDiv = document.getElementById('auth-result');
const urlResultDiv = document.getElementById('result');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const linksList = document.getElementById('links-list');
const otpEmailDisplay = document.getElementById('otp-email-display');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editSecretKeyInput = document.getElementById('edit-secret-key');
const editTargetUrlInput = document.getElementById('edit-target-url');
const closeEditBtn = document.querySelector('.close-edit-btn');
const qrModal = document.getElementById('qr-modal');
const qrModalImg = document.getElementById('qr-modal-img');
const closeQrBtn = document.querySelector('.close-qr-btn');
const refreshAnalyticsButton = document.getElementById('refresh-analytics-button');

let registrationEmail = '';
let passwordResetToken = '';

const saveToken = (token) => localStorage.setItem('accessToken', token);
const getToken = () => localStorage.getItem('accessToken');
const removeToken = () => localStorage.removeItem('accessToken');

const showView = (view) => {
  loginView.style.display = 'none';
  registerView.style.display = 'none';
  otpView.style.display = 'none';
  forgotPasswordView.style.display = 'none';
  resetPasswordView.style.display = 'none';
  appContainer.style.display = 'none';
  authContainer.style.display = 'none';

  if (view === 'app') {
    appContainer.style.display = 'grid';
  } else {
    authContainer.style.display = 'block';
    if (view === 'login') loginView.style.display = 'block';
    if (view === 'register') registerView.style.display = 'block';
    if (view === 'otp') otpView.style.display = 'block';
    if (view === 'forgot-password') forgotPasswordView.style.display = 'block';
    if (view === 'reset-password') resetPasswordView.style.display = 'block';
  }
};

const showAppView = () => {
  showView('app');
  const token = getToken();
  const username = token ? JSON.parse(atob(token.split('.')[1])).sub : 'User';
  welcomeMessage.textContent = `Welcome, ${username}!`;
  fetchUserLinks();
};

const openEditModal = (secretKey, targetUrl) => {
  editSecretKeyInput.value = secretKey;
  editTargetUrlInput.value = targetUrl;
  editModal.style.display = 'block';
  editModal.classList.add('show');
};
const closeEditModal = () => {
  editModal.style.display = 'none';
  editModal.classList.remove('show');
};
const openQrModal = (qrSrc) => {
  qrModalImg.src = qrSrc;
  qrModal.style.display = 'block';
  qrModal.classList.add('show');
};
const closeQrModal = () => {
  qrModal.style.display = 'none';
  qrModal.classList.remove('show');
};

const handleRegister = async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());
  registrationEmail = data.email;
  const response = await fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  authResultDiv.style.display = 'none';
  if (response.ok) {
    otpEmailDisplay.textContent = registrationEmail;
    showView('otp');
  } else {
    const error = await response.json();
    authResultDiv.style.display = 'block';
    authResultDiv.className = 'error';
    authResultDiv.innerHTML = `<strong>Error:</strong> ${error.detail}`;
  }
};

const handleOtpVerification = async (event) => {
  event.preventDefault();
  const formData = new FormData(otpForm);
  const otp = formData.get('otp');
  const data = { email: registrationEmail, otp: otp };
  const response = await fetch('/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  authResultDiv.style.display = 'block';
  if (response.ok) {
    authResultDiv.className = 'success';
    authResultDiv.innerHTML = '<strong>Success!</strong> Your account is verified. Please log in.';
    otpForm.reset();
    showView('login');
  } else {
    const error = await response.json();
    authResultDiv.className = 'error';
    authResultDiv.innerHTML = `<strong>Error:</strong> ${error.detail}`;
  }
};

const handleLogin = async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const response = await fetch('/token', { method: 'POST', body: formData });
  if (response.ok) {
    const result = await response.json();
    saveToken(result.access_token);
    showAppView();
    loginForm.reset();
    authResultDiv.style.display = 'none';
  } else {
    const error = await response.json();
    authResultDiv.style.display = 'block';
    authResultDiv.className = 'error';
    authResultDiv.innerHTML = `<strong>Error:</strong> ${error.detail}`;
    if (error.detail.includes('not verified')) {
      registrationEmail = formData.get('username');
      otpEmailDisplay.textContent = registrationEmail;
      setTimeout(() => showView('otp'), 2000);
    }
  }
};

const handleLogout = () => {
  removeToken();
  window.location.hash = '';
  showView('login');
};

const handleForgotPassword = async (event) => {
  event.preventDefault();
  const formData = new FormData(forgotPasswordForm);
  const data = Object.fromEntries(formData.entries());
  const response = await fetch('/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  authResultDiv.style.display = 'block';
  authResultDiv.className = 'success';
  authResultDiv.innerHTML = `<strong>Request sent!</strong> If an account with that email exists, a reset link will be sent.`;
};

const handleResetPassword = async (event) => {
  event.preventDefault();
  const newPassword = document.getElementById('new_password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  if (newPassword !== confirmPassword) {
    authResultDiv.style.display = 'block';
    authResultDiv.className = 'error';
    authResultDiv.innerHTML = '<strong>Error:</strong> Passwords do not match.';
    return;
  }
  const data = {
    token: passwordResetToken,
    new_password: newPassword,
  };
  const response = await fetch('/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  authResultDiv.style.display = 'block';
  if (response.ok) {
    authResultDiv.className = 'success';
    authResultDiv.innerHTML = '<strong>Success!</strong> Your password has been reset. Please log in.';
    resetPasswordForm.reset();
    window.location.hash = '';
    showView('login');
  } else {
    const error = await response.json();
    authResultDiv.className = 'error';
    authResultDiv.innerHTML = `<strong>Error:</strong> ${error.detail}`;
  }
};

const fetchUserLinks = async () => {
  const token = getToken();
  if (!token) return;

  refreshAnalyticsButton.disabled = true;
  refreshAnalyticsButton.classList.add('loading');
  linksList.innerHTML = `<p style='color: var(--text-secondary);'>Loading your links...</p>`;

  const response = await fetch('/me/urls', { headers: { Authorization: `Bearer ${token}` } });

  refreshAnalyticsButton.disabled = false;
  refreshAnalyticsButton.classList.remove('loading');

  if (response.ok) {
    const urls = await response.json();
    linksList.innerHTML = '';
    if (urls.length === 0) {
      linksList.innerHTML = "<p style='color: var(--text-secondary);'>Your dashboard is empty. Create a link on the left to get started!</p>";
    } else {
      urls.forEach((url) => {
        const shortUrl = `${window.location.protocol}//${window.location.host}/${url.url}`;
        let expirationInfo = 'Never';
        if (url.expires_at) {
          expirationInfo = ` ${new Date(url.expires_at).toLocaleDateString()}`;
        }

        const card = document.createElement('li');
        card.className = 'link-card fade-in';
        card.innerHTML = `
                    <div class="link-header">
                        <div class="short-url">
                            <a href="${shortUrl}" target="_blank">${shortUrl.replace(/^https?:\/\//, '')}</a>
                        </div>
                        <button class="copy-btn btn-icon" data-url="${shortUrl}" title="Copy short link">
                            ${copyIconSVG}
                        </button>
                    </div>
                    <p class="target-url">${url.target_url}</p>
                    <div class="link-footer">
                        <div class="link-stats">
                            <span><strong>${url.clicks}</strong> Clicks</span>
                            <span>Expires: <strong>${expirationInfo}</strong></span>
                        </div>
                        <div class="link-actions">
                            <div class="qr-code-container" data-qr-src="${url.qr_code}" title="Click to view QR Code">
                                <img src="${url.qr_code}" alt="QR Code" class="qr-code-img" />
                            </div>
                            <button class="analytics-btn btn-icon" title="View Analytics">${analyticsIconSVG}</button>
                            <button class="edit-btn btn-icon" data-secret-key="${url.admin_url}" data-target-url="${url.target_url}" title="Edit Link">${editIconSVG}</button>
                        </div>
                    </div>
                `;
        linksList.appendChild(card);
      });
    }
  }
};

const handleShortenUrl = async (event) => {
  event.preventDefault();
  const token = getToken();
  if (!token) return;
  const formData = new FormData(urlForm);
  const data = Object.fromEntries(formData.entries());

  const response = await fetch('/url', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
  urlResultDiv.style.display = 'block';
  if (response.ok) {
    const result = await response.json();
    urlResultDiv.className = 'success';
    const shortUrl = `${window.location.protocol}//${window.location.host}/${result.url}`;
    urlResultDiv.innerHTML = `<strong>Success!</strong> Copied to clipboard: <a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
    navigator.clipboard.writeText(shortUrl);
    urlForm.reset();
    fetchUserLinks();
  } else {
    const error = await response.json();
    urlResultDiv.className = 'error';
    urlResultDiv.innerHTML = `<strong>Error:</strong> ${error.detail}`;
  }
};

const handleEditUrl = async (event) => {
  event.preventDefault();
  const token = getToken();
  const secretKey = editSecretKeyInput.value;
  const newTargetUrl = editTargetUrlInput.value;
  const response = await fetch(`/admin/${secretKey}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ target_url: newTargetUrl }),
  });
  if (response.ok) {
    closeEditModal();
    fetchUserLinks();
  } else {
    alert('Failed to update URL. Please try again.');
  }
};

const handleRouting = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/reset-password')) {
    const urlParams = new URLSearchParams(hash.split('?')[1]);
    const token = urlParams.get('token');
    if (token) {
      passwordResetToken = token;
      showView('reset-password');
    } else {
      showView('login');
    }
  } else if (getToken()) {
    showAppView();
  } else {
    showView('login');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const refreshButtonSpan = refreshAnalyticsButton.querySelector('span');
  refreshAnalyticsButton.insertBefore(new DOMParser().parseFromString(refreshIconSVG, 'image/svg+xml').documentElement, refreshButtonSpan);
  handleRouting();
});

window.addEventListener('hashchange', handleRouting);

showRegisterLink.addEventListener('click', () => {
  showView('register');
  authResultDiv.style.display = 'none';
});
showLoginLink.addEventListener('click', () => {
  showView('login');
  authResultDiv.style.display = 'none';
});
otpBackToLoginLink.addEventListener('click', () => {
  showView('login');
  authResultDiv.style.display = 'none';
});
forgotBackToLoginLink.addEventListener('click', () => {
  showView('login');
  authResultDiv.style.display = 'none';
});
showForgotPasswordLink.addEventListener('click', () => {
  showView('forgot-password');
  authResultDiv.style.display = 'none';
});

registerForm.addEventListener('submit', handleRegister);
otpForm.addEventListener('submit', handleOtpVerification);
loginForm.addEventListener('submit', handleLogin);
forgotPasswordForm.addEventListener('submit', handleForgotPassword);
resetPasswordForm.addEventListener('submit', handleResetPassword);
logoutButton.addEventListener('click', handleLogout);
urlForm.addEventListener('submit', handleShortenUrl);
editForm.addEventListener('submit', handleEditUrl);

closeEditBtn.addEventListener('click', closeEditModal);
closeQrBtn.addEventListener('click', closeQrModal);

window.addEventListener('click', (event) => {
  if (event.target == editModal) closeEditModal();
  if (event.target == qrModal) closeQrModal();
});

refreshAnalyticsButton.addEventListener('click', fetchUserLinks);

linksList.addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-btn');
  const analyticsBtn = event.target.closest('.analytics-btn');
  const copyBtn = event.target.closest('.copy-btn');
  const qrCodeContainer = event.target.closest('.qr-code-container');

  if (editBtn) {
    openEditModal(editBtn.dataset.secretKey, editBtn.dataset.targetUrl);
  }
  if (analyticsBtn) {
    alert('A full analytics page with charts and graphs is a great next feature to build!');
  }
  if (copyBtn) {
    const urlToCopy = copyBtn.dataset.url;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      const originalContent = copyBtn.innerHTML;
      copyBtn.innerHTML = `<span>✓</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = originalContent;
      }, 2000);
    });
  }
  if (qrCodeContainer) {
    const qrSrc = qrCodeContainer.dataset.qrSrc;
    if (qrSrc) {
      openQrModal(qrSrc);
    }
  }
});
