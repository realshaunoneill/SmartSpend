// ReceiptWise Clipper - Service Worker
// Optimized for fast response and reliable operation

// API Configuration - Use production URL
const API_BASE_URL = 'https://www.receiptwise.io';

// State
let uploadCount = 0;

// ============================================
// URL Restriction Handling
// ============================================

const RESTRICTED_PATTERNS = [
  'chrome://', 'chrome-extension://', 'edge://', 'about:', 'data:',
  'file://', 'devtools://', 'view-source:',
  'https://mail.google.com', 'https://accounts.google.com',
  'https://myaccount.google.com', 'https://payments.google.com',
  'https://pay.google.com', 'https://chrome.google.com/webstore',
  'https://addons.mozilla.org', 'https://microsoftedge.microsoft.com',
];

const COMPLETELY_BLOCKED = [
  'chrome://', 'chrome-extension://', 'edge://', 'about:', 'devtools://', 'view-source:',
];

function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_PATTERNS.some(pattern => url.startsWith(pattern));
}

function isCompletelyBlocked(url) {
  if (!url) return true;
  return COMPLETELY_BLOCKED.some(pattern => url.startsWith(pattern));
}

// ============================================
// Screenshot & Cropper Fallback
// ============================================

async function captureFullTabAndOpenCropper(tabId) {
  try {
    const imageData = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    const screenshotKey = Date.now().toString();
    
    await chrome.storage.local.set({ [`screenshot_${screenshotKey}`]: imageData });
    
    chrome.tabs.create({
      url: `cropper/cropper.html?key=${screenshotKey}`,
      active: true,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to capture tab:', error);
    showNotification('error', 'Capture Failed', 'Unable to take screenshot of this page.');
    return false;
  }
}

// ============================================
// Content Script Injection
// ============================================

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js'],
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/content.css'],
    });
    return true;
  } catch (error) {
    console.error('Failed to inject content script:', error);
    return false;
  }
}

async function ensureContentScriptLoaded(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return true;
  } catch {
    return await injectContentScript(tabId);
  }
}

// ============================================
// Capture Flow
// ============================================

async function startCaptureOnTab(tabId, url) {
  if (isRestrictedUrl(url)) {
    await captureFullTabAndOpenCropper(tabId);
    return;
  }

  const scriptLoaded = await ensureContentScriptLoaded(tabId);
  
  if (!scriptLoaded) {
    await captureFullTabAndOpenCropper(tabId);
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'startCapture' });
  } catch {
    await captureFullTabAndOpenCropper(tabId);
  }
}

// ============================================
// Keyboard Shortcut Handler
// ============================================

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'capture-receipt') return;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  if (isCompletelyBlocked(tab.url)) {
    showNotification('error', 'Cannot Capture', 'Browser system pages cannot be captured.');
    return;
  }

  await startCaptureOnTab(tab.id, tab.url);
});

// ============================================
// Message Handler
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'uploadReceipt':
      handleReceiptUpload(message.imageData, sender.tab?.id);
      sendResponse({ received: true });
      break;

    case 'uploadReceiptWithResponse':
      handleReceiptUploadWithResponse(message.imageData)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'captureAndCrop':
      (async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) await captureFullTabAndOpenCropper(tab.id);
      })();
      sendResponse({ received: true });
      break;

    case 'startCapture':
      (async () => {
        const tabId = message.tabId || sender.tab?.id;
        if (!tabId) return;
        
        // Get tab URL for restriction check
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = message.url || tab?.url;
        
        await startCaptureOnTab(tabId, url);
      })();
      sendResponse({ received: true });
      break;

    case 'captureTab':
    case 'getScreenshot':
      captureVisibleTab().then(data => {
        sendResponse(message.action === 'captureTab' ? { imageData: data } : { screenshot: data });
      });
      return true;
  }
  return true;
});

// ============================================
// Tab Screenshot
// ============================================

async function captureVisibleTab() {
  try {
    return await chrome.tabs.captureVisibleTab(null, { format: 'png' });
  } catch (error) {
    console.error('Failed to capture tab:', error);
    return null;
  }
}

// ============================================
// Upload Handling
// ============================================

function base64ToBlob(imageData) {
  const base64Data = imageData.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteArray], { type: 'image/png' });
}

async function uploadToServer(apiKey, blob) {
  const formData = new FormData();
  formData.append('file', blob, `receipt-${Date.now()}.png`);

  const response = await fetch(`${API_BASE_URL}/api/extension/upload`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Upload failed (${response.status})`;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}
    } else if (response.status === 404) {
      errorMessage = 'API endpoint not found.';
    } else if (response.status === 401) {
      errorMessage = 'Invalid API key. Please check your settings.';
    } else if (response.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    throw new Error(errorMessage);
  }

  if (!isJson) throw new Error('Invalid server response.');
  return await response.json();
}

async function handleReceiptUpload(imageData, tabId) {
  try {
    notifyPopup('uploadStarted');
    showNotification('uploading', 'Uploading...', 'Processing your receipt...');

    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
      notifyPopup('uploadError', { error: 'Not connected. Please set your API key.' });
      showNotification('error', 'Not Connected', 'Please set your API key in the extension popup.');
      return;
    }

    const blob = base64ToBlob(imageData);
    const result = await uploadToServer(apiKey, blob);

    notifyPopup('uploadSuccess', { receiptId: result.receiptId });
    showNotification('success', 'Receipt Uploaded!', 'Your receipt has been sent to ReceiptWise for processing.');
  } catch (error) {
    console.error('Upload error:', error);
    notifyPopup('uploadError', { error: error.message });
    showNotification('error', 'Upload Failed', error.message);
  }
}

async function handleReceiptUploadWithResponse(imageData) {
  try {
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
      return { success: false, error: 'Not connected. Please set your API key in the extension popup.' };
    }

    const blob = base64ToBlob(imageData);
    const result = await uploadToServer(apiKey, blob);

    showNotification('success', 'Receipt Uploaded!', 'Your receipt has been sent to ReceiptWise for processing.');
    return { success: true, receiptId: result.receiptId };
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('error', 'Upload Failed', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Notifications
// ============================================

function notifyPopup(action, data = {}) {
  chrome.runtime.sendMessage({ action, ...data }).catch(() => {});
}

function showNotification(type, title, message) {
  if (type === 'success') {
    uploadCount++;
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else if (type === 'error') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else if (type === 'uploading') {
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: type === 'error' ? 2 : 1,
  }).catch(() => {});

  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
}

// ============================================
// Lifecycle Events
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'popup/popup.html' });
  } else if (details.reason === 'update') {
    uploadCount = 0;
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: `${API_BASE_URL}/receipts` });
  chrome.notifications.clear(notificationId);
});
