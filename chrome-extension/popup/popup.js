// DOM Elements
const container = document.getElementById('container');
const setupView = document.getElementById('setup-view');
const mainView = document.getElementById('main-view');
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');
const captureBtn = document.getElementById('capture-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const uploadStatus = document.getElementById('upload-status');
const uploadSuccess = document.getElementById('upload-success');
const uploadError = document.getElementById('upload-error');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const toggleVisibilityBtn = document.getElementById('toggle-visibility');

// API Configuration - Use production URL
const API_BASE_URL = 'https://www.receiptwise.io';

// Cache API key state
let cachedApiKey = null;
let currentTab = null;

// Pre-fetch current tab info immediately
chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  currentTab = tabs[0];
});

// Initialize popup immediately with cached state
chrome.storage.sync.get('apiKey').then(({ apiKey }) => {
  cachedApiKey = apiKey;
  if (apiKey) {
    showMainView();
  } else {
    showSetupView();
  }
  // Show UI with fade-in
  requestAnimationFrame(() => {
    container.classList.add('ready');
  });
});

// Listen for storage changes to update cache
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.apiKey) {
    cachedApiKey = changes.apiKey.newValue;
  }
});

// Show/Hide Views
function showSetupView() {
  setupView.classList.remove('hidden');
  mainView.classList.add('hidden');
}

function showMainView() {
  setupView.classList.add('hidden');
  mainView.classList.remove('hidden');
  hideAllStatuses();
}

function hideAllStatuses() {
  uploadStatus.classList.add('hidden');
  uploadSuccess.classList.add('hidden');
  uploadError.classList.add('hidden');
}

// Toggle API key visibility
toggleVisibilityBtn?.addEventListener('click', () => {
  const eyeIcon = toggleVisibilityBtn.querySelector('.eye-icon');
  const eyeOffIcon = toggleVisibilityBtn.querySelector('.eye-off-icon');

  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    eyeIcon.classList.add('hidden');
    eyeOffIcon.classList.remove('hidden');
  } else {
    apiKeyInput.type = 'password';
    eyeIcon.classList.remove('hidden');
    eyeOffIcon.classList.add('hidden');
  }
});

// Save API Key
saveKeyBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showInputError('Please enter your API key');
    return;
  }

  // Validate API key format (should start with rw_)
  if (!apiKey.startsWith('rw_')) {
    showInputError('Invalid format. API key should start with rw_');
    return;
  }

  // Store original button content
  const originalContent = saveKeyBtn.innerHTML;
  saveKeyBtn.innerHTML = `
    <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
    Verifying...
  `;
  saveKeyBtn.disabled = true;

  try {
    // Verify API key by making a test request
    const isValid = await verifyApiKey(apiKey);

    if (isValid) {
      await chrome.storage.sync.set({ apiKey });
      cachedApiKey = apiKey;
      showMainView();
    } else {
      apiKeyInput.style.borderColor = '#ef4444';
      apiKeyInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
      saveKeyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Invalid API Key
      `;
      setTimeout(() => {
        saveKeyBtn.innerHTML = originalContent;
        saveKeyBtn.disabled = false;
      }, 2500);
    }
  } catch (error) {
    console.error('Error verifying API key:', error);
    saveKeyBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      Connection Failed
    `;
    setTimeout(() => {
      saveKeyBtn.innerHTML = originalContent;
      saveKeyBtn.disabled = false;
    }, 2500);
  }
});

// Verify API Key
async function verifyApiKey(apiKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API verification error:', error);
    return false;
  }
}

// List of restricted URLs where content scripts can't run
const RESTRICTED_PATTERNS = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'data:',
  'file://',
  'devtools://',
  'view-source:',
  // Google properties that block content scripts
  'https://mail.google.com',
  'https://accounts.google.com',
  'https://myaccount.google.com', 
  'https://payments.google.com',
  'https://pay.google.com',
  'https://chrome.google.com/webstore',
  // Other restricted sites
  'https://addons.mozilla.org',
  'https://microsoftedge.microsoft.com',
];

function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_PATTERNS.some(pattern => url.startsWith(pattern));
}

function getBlockedReason(url) {
  if (!url) return 'this page';
  if (url.startsWith('chrome://') || url.startsWith('edge://')) return 'browser system pages';
  if (url.startsWith('chrome-extension://')) return 'extension pages';
  if (url.includes('mail.google.com')) return 'Gmail';
  if (url.includes('accounts.google.com')) return 'Google login pages';
  if (url.includes('chrome.google.com/webstore')) return 'Chrome Web Store';
  if (url.includes('google.com')) return 'this Google page';
  return 'this restricted page';
}

// Check if URL is completely blocked (can't even take screenshot)
function isCompletelyBlocked(url) {
  if (!url) return true;
  const blocked = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'devtools://', 'view-source:'];
  return blocked.some(pattern => url.startsWith(pattern));
}

// Capture full tab and open cropper (fallback for restricted sites)
async function captureFullTabAndOpenCropper() {
  try {
    // Send message to background to handle the capture
    chrome.runtime.sendMessage({ action: 'captureAndCrop' });
    window.close();
  } catch (error) {
    console.error('Failed to initiate capture:', error);
    alert('Failed to capture. Please try again.');
  }
}

// Capture Button Click
captureBtn.addEventListener('click', async () => {
  // Use cached tab or fetch if not available
  const tab = currentTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

  if (!tab?.id || !tab.url) {
    alert('Unable to access this tab.');
    return;
  }

  // Check if completely blocked (can't even screenshot)
  if (isCompletelyBlocked(tab.url)) {
    const reason = getBlockedReason(tab.url);
    alert(`Cannot capture on ${reason}.\\n\\nPlease navigate to a regular webpage and try again.`);
    return;
  }

  // Close popup immediately for faster response
  window.close();

  // Check if this is a restricted URL (but can still screenshot)
  if (isRestrictedUrl(tab.url)) {
    // Use fallback: capture full tab and open cropper
    chrome.runtime.sendMessage({ action: 'captureAndCrop' });
    return;
  }

  // Try normal content script flow - send to background to handle
  chrome.runtime.sendMessage({ 
    action: 'startCapture',
    tabId: tab.id,
    url: tab.url
  });
});

// Disconnect Account
disconnectBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove('apiKey');
  cachedApiKey = null;
  apiKeyInput.value = '';
  showSetupView();
});

// Retry Button
retryBtn.addEventListener('click', () => {
  hideAllStatuses();
  captureBtn.click();
});

// Listen for upload status from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadStarted') {
    hideAllStatuses();
    uploadStatus.classList.remove('hidden');
  } else if (message.action === 'uploadSuccess') {
    hideAllStatuses();
    uploadSuccess.classList.remove('hidden');
  } else if (message.action === 'uploadError') {
    hideAllStatuses();
    errorMessage.textContent = message.error || 'Upload failed';
    uploadError.classList.remove('hidden');
  }
});

// Input validation reset
apiKeyInput.addEventListener('input', () => {
  apiKeyInput.style.borderColor = '';
  apiKeyInput.style.boxShadow = '';
});

// Allow Enter key to submit API key
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveKeyBtn.click();
  }
});

// Helper to show input error
function showInputError(message) {
  apiKeyInput.style.borderColor = '#ef4444';
  apiKeyInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
  apiKeyInput.setAttribute('title', message);
  apiKeyInput.focus();
}
