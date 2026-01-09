// API Configuration
// const API_BASE_URL = 'https://www.receiptwise.io';
const API_BASE_URL = 'http://localhost:3000';

// Track upload count for badge
let uploadCount = 0;

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
  'https://mail.google.com',
  'https://accounts.google.com',
  'https://myaccount.google.com', 
  'https://payments.google.com',
  'https://pay.google.com',
  'https://chrome.google.com/webstore',
  'https://addons.mozilla.org',
  'https://microsoftedge.microsoft.com',
];

function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_PATTERNS.some(pattern => url.startsWith(pattern));
}

function getBlockedMessage(url) {
  if (!url) return 'Cannot capture on this page.';
  if (url.includes('mail.google.com')) return 'Gmail blocks extensions. Opening screenshot cropper...';
  if (url.includes('accounts.google.com')) return 'Google login pages block extensions.';
  if (url.includes('chrome.google.com')) return 'Chrome Web Store blocks extensions.';
  if (url.startsWith('chrome://')) return 'Browser system pages cannot be captured.';
  return 'This page blocks extensions. Opening screenshot cropper...';
}

// Check if URL is completely blocked (can't even take screenshot)
function isCompletelyBlocked(url) {
  if (!url) return true;
  const blocked = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'devtools://', 'view-source:'];
  return blocked.some(pattern => url.startsWith(pattern));
}

// Capture full tab and open cropper for restricted sites
async function captureFullTabAndOpenCropper(tabId) {
  try {
    // Capture the visible tab
    const imageData = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Generate a unique key for this screenshot
    const screenshotKey = Date.now().toString();
    
    // Store screenshot temporarily
    await chrome.storage.local.set({ [`screenshot_${screenshotKey}`]: imageData });
    
    // Open cropper page
    chrome.tabs.create({
      url: `cropper/cropper.html?key=${screenshotKey}`,
      active: true
    });
    
    return true;
  } catch (error) {
    console.error('Failed to capture tab:', error);
    showNotification('error', 'Capture Failed', 'Unable to take screenshot of this page.');
    return false;
  }
}

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-receipt') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return;
    
    // Check if completely blocked (can't even screenshot)
    if (isCompletelyBlocked(tab.url)) {
      showNotification('error', 'Cannot Capture', 'Browser system pages cannot be captured.');
      return;
    }
    
    // Check if this is a restricted URL (content scripts blocked but can still screenshot)
    if (isRestrictedUrl(tab.url)) {
      // Use fallback: capture full tab and open cropper
      await captureFullTabAndOpenCropper(tab.id);
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
          chrome.tabs.sendMessage(tab.id, { action: 'startCapture' }).catch(async () => {
            // If still fails, use fallback
            await captureFullTabAndOpenCropper(tab.id);
          });
        }, 50);
      } catch (err) {
        console.error('Failed to inject content script:', err);
        // Use fallback for any injection failure
        await captureFullTabAndOpenCropper(tab.id);
      }
    }
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadReceipt') {
    handleReceiptUpload(message.imageData, sender.tab?.id);
    sendResponse({ received: true });
  } else if (message.action === 'uploadReceiptWithResponse') {
    // Upload with response for cropper page
    handleReceiptUploadWithResponse(message.imageData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  } else if (message.action === 'captureAndCrop') {
    // Popup requesting fallback capture
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await captureFullTabAndOpenCropper(tab.id);
      }
    })();
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

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `Upload failed (${response.status})`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // JSON parse failed, use default message
        }
      } else if (response.status === 404) {
        errorMessage = 'API endpoint not found. Is your server running?';
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your settings.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    // Parse JSON response
    if (!isJson) {
      throw new Error('Invalid server response. Expected JSON.');
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

// Handle receipt upload with response (for cropper page)
async function handleReceiptUploadWithResponse(imageData) {
  try {
    // Get API key from storage
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
      return { success: false, error: 'Not connected. Please set your API key in the extension popup.' };
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

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `Upload failed (${response.status})`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // JSON parse failed, use default message
        }
      } else if (response.status === 404) {
        errorMessage = 'API endpoint not found. Is your server running?';
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your settings.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    // Parse JSON response
    if (!isJson) {
      throw new Error('Invalid server response. Expected JSON.');
    }

    const result = await response.json();

    // Show success notification
    showNotification('success', 'Receipt Uploaded!', 'Your receipt has been sent to ReceiptWise for processing.');

    return { success: true, receiptId: result.receiptId };

  } catch (error) {
    console.error('Upload error:', error);
    showNotification('error', 'Upload Failed', error.message);
    return { success: false, error: error.message };
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
