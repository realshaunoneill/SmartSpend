// DOM Elements
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

// API Configuration
// const API_BASE_URL = 'https://www.receiptwise.io';
const API_BASE_URL = 'http://localhost:3000';

// Initialize popup immediately (script is at end of body, DOM is ready)
(async () => {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  
  if (apiKey) {
    showMainView();
  } else {
    showSetupView();
  }
})();

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

// Capture Button Click
captureBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id) return;
  
  // Check if we can inject scripts (not on chrome:// or extension pages)
  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    alert('Cannot capture on Chrome system pages. Please navigate to a regular webpage.');
    return;
  }
  
  // Send message to trigger capture (content script is already injected via manifest)
  chrome.tabs.sendMessage(tab.id, { action: 'startCapture' }).catch(() => {
    // Ignore errors - content script might not be ready yet on first page load
  });
  
  // Close popup immediately to allow capture
  window.close();
});

// Disconnect Account
disconnectBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove('apiKey');
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
