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

// API Configuration
const API_BASE_URL = 'https://www.receiptwise.io';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  
  if (apiKey) {
    showMainView();
  } else {
    showSetupView();
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

// Save API Key
saveKeyBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    apiKeyInput.style.borderColor = '#ef4444';
    return;
  }

  saveKeyBtn.textContent = 'Verifying...';
  saveKeyBtn.disabled = true;

  try {
    // Verify API key by making a test request
    const isValid = await verifyApiKey(apiKey);
    
    if (isValid) {
      await chrome.storage.sync.set({ apiKey });
      showMainView();
    } else {
      apiKeyInput.style.borderColor = '#ef4444';
      saveKeyBtn.textContent = 'Invalid API Key';
      setTimeout(() => {
        saveKeyBtn.textContent = 'Connect Account';
        saveKeyBtn.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Error verifying API key:', error);
    saveKeyBtn.textContent = 'Connection Failed';
    setTimeout(() => {
      saveKeyBtn.textContent = 'Connect Account';
      saveKeyBtn.disabled = false;
    }, 2000);
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
  // Send message to content script to start capture
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
    window.close(); // Close popup to allow capture
  }
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
});
