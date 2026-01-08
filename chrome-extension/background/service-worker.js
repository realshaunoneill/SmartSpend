// API Configuration
// const API_BASE_URL = 'https://www.receiptwise.io';
const API_BASE_URL = 'http://localhost:3000';

// Track upload count for badge
let uploadCount = 0;

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-receipt') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    
    // Skip chrome:// and extension pages
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      showNotification('error', 'Cannot Capture', 'Please navigate to a regular webpage first.');
      return;
    }
    
    try {
      // Try sending to content script first
      await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
    } catch {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
        // Small delay then trigger capture
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'startCapture' }).catch(() => {});
        }, 50);
      } catch (err) {
        console.error('Failed to inject content script:', err);
        showNotification('error', 'Cannot Capture', 'Unable to capture on this page.');
      }
    }
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadReceipt') {
    handleReceiptUpload(message.imageData, sender.tab?.id);
    sendResponse({ received: true });
  } else if (message.action === 'captureTab') {
    // Capture the visible tab for the content script
    captureVisibleTab(sender.tab?.id).then(imageData => {
      sendResponse({ imageData });
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'getScreenshot') {
    captureVisibleTab(sender.tab?.id).then(screenshot => {
      sendResponse({ screenshot });
    });
    return true;
  }
  return true;
});

// Capture visible tab screenshot
async function captureVisibleTab(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    return dataUrl;
  } catch (error) {
    console.error('Failed to capture tab:', error);
    return null;
  }
}

// Handle receipt upload
async function handleReceiptUpload(imageData, tabId) {
  try {
    // Notify popup that upload started
    notifyPopup('uploadStarted');
    showNotification('uploading', 'Uploading...', 'Processing your receipt...');

    // Get API key from storage
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
      notifyPopup('uploadError', { error: 'Not connected. Please set your API key.' });
      showNotification('error', 'Not Connected', 'Please set your API key in the extension popup.');
      return;
    }

    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, `receipt-${Date.now()}.png`);

    // Upload to ReceiptWise API
    const response = await fetch(`${API_BASE_URL}/api/extension/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed (${response.status})`);
    }

    const result = await response.json();

    // Notify popup of success
    notifyPopup('uploadSuccess', { receiptId: result.receiptId });

    // Show success notification
    showNotification('success', 'Receipt Uploaded!', 'Your receipt has been sent to ReceiptWise for processing.');

  } catch (error) {
    console.error('Upload error:', error);
    notifyPopup('uploadError', { error: error.message });
    showNotification('error', 'Upload Failed', error.message);
  }
}

// Send message to popup
function notifyPopup(action, data = {}) {
  chrome.runtime.sendMessage({ action, ...data }).catch(() => {
    // Popup might be closed, ignore error
  });
}

// Show browser notification
function showNotification(type, title, message) {
  // Use badge to indicate status
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
    return; // Don't clear uploading badge
  }

  // Show system notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1
  }).catch(() => {});

  // Clear badge after 3 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 3000);
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.tabs.create({ url: 'popup/popup.html' });
  } else if (details.reason === 'update') {
    // Clear any stale state on update
    uploadCount = 0;
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open ReceiptWise receipts page when notification clicked
  chrome.tabs.create({ url: `${API_BASE_URL}/receipts` });
  chrome.notifications.clear(notificationId);
});
