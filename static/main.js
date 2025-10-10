// --- SVG ICONS ---
const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V14.25c0-1.243-1.007-2.25-2.25-2.25h-5.25c-1.243 0-2.25 1.007-2.25 2.25v3.5m7.5 10.375h-9.75a.375.375 0 01-.375-.375V8.25a.375.375 0 01.375-.375h9.75a.375.375 0 01.375.375v9.375a.375.375 0 01-.375.375z" /></svg>`;
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;
const analyticsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 21v-7.875zM12.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM21 4.125C21 3.504 21.504 3 22.125 3h.375c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-.375A1.125 1.125 0 0121 21.875V4.125z" /></svg>`;
const refreshIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348A1.875 1.875 0 0014.19 7.5H13.5m-1.566 0A2.25 2.25 0 0010.5 9.75a2.25 2.25 0 002.25 2.25H15M9.912 21.75V19.5m0-4.5V12m0-3L8.25 4.5M6 15.75L4.72 17.03a3.375 3.375 0 000 4.74l.879.879H20.25M17.25 9.75L19.5 7.5m0 0l-2.25-2.25M22.5 10.5h-1.657a2.25 2.25 0 00-1.243.385l-1.144.763V4.5M10.5 15.75L11.75 14.5m0-4.5V7.5M10.5 4.5V3m0-3L8.25 4.5" /></svg>`;

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const urlForm = document.getElementById('url-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authResultDiv = document.getElementById('auth-result');
const urlResultDiv = document.getElementById('result');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const linksList = document.getElementById('links-list');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editSecretKeyInput = document.getElementById('edit-secret-key');
const editTargetUrlInput = document.getElementById('edit-target-url');
const closeEditBtn = document.querySelector('.close-edit-btn');
const qrModal = document.getElementById('qr-modal');
const qrModalImg = document.getElementById('qr-modal-img');
const closeQrBtn = document.querySelector('.close-qr-btn');
const refreshAnalyticsButton = document.getElementById('refresh-analytics-button');

// --- Token Management ---
const saveToken = (token) => localStorage.setItem('accessToken', token);
const getToken = () => localStorage.getItem('accessToken');
const removeToken = () => localStorage.removeItem('accessToken');

// --- UI State Management ---
const showLoginView = () => {
  authContainer.style.display = 'block';
  appContainer.style.display = 'none';
};
const showAppView = () => {
  authContainer.style.display = 'none';
  appContainer.style.display = 'grid';
  const token = getToken();
  const username = token ? JSON.parse(atob(token.split('.')[1])).sub : 'User';
  welcomeMessage.textContent = `Welcome, ${username}!`;
  fetchUserLinks();
};

// --- Modal Management ---
const openEditModal = (secretKey, targetUrl) => {
  editSecretKeyInput.value = secretKey;
  editTargetUrlInput.value = targetUrl;
  editModal.style.display = 'block';
};
const closeEditModal = () => {
  editModal.style.display = 'none';
};
const openQrModal = (qrSrc) => {
  qrModalImg.src = qrSrc;
  qrModal.style.display = 'block';
};
const closeQrModal = () => {
  qrModal.style.display = 'none';
};

// --- API Calls & Logic ---
const handleRegister = async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());
  const response = await fetch('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  authResultDiv.style.display = 'block';
  if (response.ok) {
    authResultDiv.className = 'success';
    authResultDiv.innerHTML = '<strong>Success!</strong> You can now log in.';
    registerForm.reset();
    loginView.style.display = 'block';
    registerView.style.display = 'none';
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
  }
};
const handleLogout = () => {
  removeToken();
  showLoginView();
};

const processAnalytics = (clicksInfo) => {
  if (!clicksInfo || clicksInfo.length === 0) return 'No clicks yet.';
  const clicksByDay = clicksInfo.reduce((acc, click) => {
    const date = new Date(click.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(clicksByDay)
    .map(([date, count]) => `<li>${date}: ${count} clicks</li>`)
    .join('');
};

const fetchUserLinks = async () => {
  const token = getToken();
  if (!token) return;

  refreshAnalyticsButton.disabled = true;
  refreshAnalyticsButton.classList.add('loading');

  const response = await fetch('/me/urls', { headers: { Authorization: `Bearer ${token}` } });
  if (response.ok) {
    const urls = await response.json();
    linksList.innerHTML = '';
    if (urls.length === 0) {
      linksList.innerHTML = '<p>Your dashboard is empty. Create a link to get started!</p>';
    } else {
      urls.forEach((url) => {
        const shortUrl = `${window.location.protocol}//${window.location.host}/${url.url}`;
        let expirationInfo = 'Never';
        if (url.expires_at) {
          expirationInfo = ` ${new Date(url.expires_at).toLocaleDateString()}`;
        }
        const analyticsSummary = processAnalytics(url.clicks_info);

        const card = document.createElement('li');
        card.className = 'link-card';
        card.innerHTML = `
                        <div class="link-header">
                            <div class="short-url">
                                <a href="${shortUrl}" target="_blank">${shortUrl.replace(/^https?:\/\//, '')}</a>
                            </div>
                            <button class="copy-btn" data-url="${shortUrl}">
                                ${copyIconSVG}
                                <span class="copy-text">Copy</span>
                            </button>
                        </div>
                        <p class="target-url">→ ${url.target_url}</p>
                        <div class="link-footer">
                            <div class="link-stats">
                                <strong>${url.clicks}</strong> Clicks | Expires: <strong>${expirationInfo}</strong>
                            </div>
                            <div class="link-actions">
                                <div class="qr-code-container" data-qr-src="${url.qr_code}" title="Click to view QR Code">
                                    <img src="${url.qr_code}" alt="QR Code" class="qr-code-img" />
                                </div>
                                <button class="analytics-btn btn-secondary" title="View Analytics">${analyticsIconSVG}</button>
                                <button class="edit-btn" data-secret-key="${url.admin_url}" data-target-url="${url.target_url}" title="Edit Link">${editIconSVG}</button>
                            </div>
                        </div>
                        <div class="analytics-details" style="display: none;">
                            <strong>Clicks per Day:</strong>
                            <ul>${analyticsSummary}</ul>
                        </div>
                    `;
        linksList.appendChild(card);
      });
    }
  }

  refreshAnalyticsButton.disabled = false;
  refreshAnalyticsButton.classList.remove('loading');
};

const handleShortenUrl = async (event) => {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    urlResultDiv.className = 'error';
    urlResultDiv.innerHTML = '<strong>Error:</strong> You must be logged in.';
    return;
  }
  const formData = new FormData(urlForm);
  const targetUrl = formData.get('target_url');
  const customKey = formData.get('custom_key');
  const expiresAt = formData.get('expires_at');
  const data = { target_url: targetUrl };
  if (customKey) data.custom_key = customKey;
  if (expiresAt) data.expires_at = expiresAt;
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

// --- Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    showAppView();
  } else {
    showLoginView();
  }
});
showRegisterLink.addEventListener('click', () => {
  loginView.style.display = 'none';
  registerView.style.display = 'block';
  authResultDiv.style.display = 'none';
});
showLoginLink.addEventListener('click', () => {
  registerView.style.display = 'none';
  loginView.style.display = 'block';
  authResultDiv.style.display = 'none';
});
registerForm.addEventListener('submit', handleRegister);
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
urlForm.addEventListener('submit', handleShortenUrl);
editForm.addEventListener('submit', handleEditUrl);

// Listeners for closing modals
closeEditBtn.addEventListener('click', closeEditModal);
closeQrBtn.addEventListener('click', closeQrModal);
window.addEventListener('click', (event) => {
  if (event.target == editModal) closeEditModal();
  if (event.target == qrModal) closeQrModal();
});

// Listener for refresh button
refreshAnalyticsButton.addEventListener('click', fetchUserLinks);

// Event delegation for dynamic buttons in link list
linksList.addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-btn');
  const analyticsBtn = event.target.closest('.analytics-btn');
  const copyBtn = event.target.closest('.copy-btn');
  const qrCodeContainer = event.target.closest('.qr-code-container');

  if (editBtn) {
    openEditModal(editBtn.dataset.secretKey, editBtn.dataset.targetUrl);
  }
  if (analyticsBtn) {
    const detailsDiv = analyticsBtn.closest('.link-card').querySelector('.analytics-details');
    detailsDiv.style.display = detailsDiv.style.display === 'block' ? 'none' : 'block';
  }
  if (copyBtn) {
    const urlToCopy = copyBtn.dataset.url;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      const copyText = copyBtn.querySelector('.copy-text');
      copyText.textContent = 'Copied!';
      setTimeout(() => {
        copyText.textContent = 'Copy';
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
