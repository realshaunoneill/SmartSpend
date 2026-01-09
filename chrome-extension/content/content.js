// ReceiptWise Clipper - Content Script
// Handles the screen capture overlay and snipping functionality

let isCapturing = false;
let overlay = null;
let selectionBox = null;
let sizeIndicator = null;
let startX = 0;
let startY = 0;

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    // Simple ping to check if content script is loaded
    sendResponse({ pong: true });
    return true;
  }
  if (message.action === 'startCapture') {
    // Prevent duplicate captures
    if (isCapturing) {
      sendResponse({ started: false, reason: 'already capturing' });
      return true;
    }
    startCapture();
    sendResponse({ started: true });
  }
  return true;
});

// Start capture mode
function startCapture() {
  if (isCapturing) return;
  isCapturing = true;

  // Create overlay
  overlay = document.createElement('div');
  overlay.id = 'receiptwise-overlay';
  overlay.innerHTML = `
    <div class="receiptwise-instructions">
      <span>Click and drag to select area</span>
      <span class="receiptwise-hint">Press <kbd>Esc</kbd> to cancel</span>
    </div>
  `;
  document.body.appendChild(overlay);

  // Create selection box
  selectionBox = document.createElement('div');
  selectionBox.id = 'receiptwise-selection';
  document.body.appendChild(selectionBox);
  
  // Create size indicator
  sizeIndicator = document.createElement('div');
  sizeIndicator.id = 'receiptwise-size';
  sizeIndicator.className = 'receiptwise-size-indicator';
  document.body.appendChild(sizeIndicator);

  // Add event listeners
  overlay.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('keydown', handleKeyDown);
}

// Handle mouse down - start selection
function handleMouseDown(e) {
  if (!isCapturing) return;
  
  // Only handle left mouse button
  if (e.button !== 0) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  startX = e.clientX;
  startY = e.clientY;

  selectionBox.style.left = `${startX}px`;
  selectionBox.style.top = `${startY}px`;
  selectionBox.style.width = '0';
  selectionBox.style.height = '0';
  selectionBox.classList.add('active');

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Handle mouse move - update selection
function handleMouseMove(e) {
  if (!isCapturing) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);

  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  
  // Update size indicator
  if (sizeIndicator && width > 50 && height > 50) {
    sizeIndicator.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    sizeIndicator.style.left = `${left + width / 2}px`;
    sizeIndicator.style.top = `${top + height + 8}px`;
    sizeIndicator.style.display = 'block';
  }
}

// Handle mouse up - complete selection
async function handleMouseUp(e) {
  if (!isCapturing) return;

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  const rect = selectionBox.getBoundingClientRect();
  
  // Minimum size check
  if (rect.width < 20 || rect.height < 20) {
    cancelCapture();
    return;
  }

  // Hide overlay for screenshot
  overlay.style.display = 'none';
  selectionBox.style.display = 'none';

  try {
    // Capture the visible tab
    const imageData = await captureSelection(rect);
    
    if (imageData) {
      // Send to background script for upload
      chrome.runtime.sendMessage({
        action: 'uploadReceipt',
        imageData: imageData,
      });
      
      showCaptureSuccess();
    }
  } catch (error) {
    console.error('Capture error:', error);
    showCaptureError(error.message);
  }

  // Cleanup
  cancelCapture();
}

// Capture the selected area
async function captureSelection(rect) {
  return new Promise((resolve, reject) => {
    // Request screenshot from background
    chrome.runtime.sendMessage({ action: 'captureTab' }, async (response) => {
      if (chrome.runtime.lastError) {
        // Fallback: use html2canvas or manual capture
        try {
          const canvas = await captureWithCanvas(rect);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
        return;
      }
      
      if (response?.imageData) {
        // Crop the image to selection
        const croppedImage = await cropImage(response.imageData, rect);
        resolve(croppedImage);
      } else {
        // Fallback to canvas capture
        try {
          const canvas = await captureWithCanvas(rect);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

// Capture using canvas (fallback method)
async function captureWithCanvas(rect) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Account for device pixel ratio for sharp captures
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Scale context for high DPI
  ctx.scale(dpr, dpr);
  
  // Use html2canvas-like approach: render the page to canvas
  // For simplicity, we'll capture a screenshot of the viewport
  // and crop it to the selection area
  
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getScreenshot' }, (response) => {
      if (response?.screenshot) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            rect.left * dpr,
            rect.top * dpr,
            rect.width * dpr,
            rect.height * dpr,
            0,
            0,
            rect.width,
            rect.height
          );
          resolve(canvas);
        };
        img.onerror = reject;
        img.src = response.screenshot;
      } else {
        reject(new Error('Failed to capture screenshot'));
      }
    });
  });
}

// Crop image to selection area
async function cropImage(imageDataUrl, rect) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.drawImage(
        img,
        rect.left * dpr,
        rect.top * dpr,
        rect.width * dpr,
        rect.height * dpr,
        0,
        0,
        rect.width * dpr,
        rect.height * dpr
      );
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

// Handle keyboard events
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    cancelCapture();
  }
}

// Cancel capture mode
function cancelCapture() {
  isCapturing = false;
  
  // Remove event listeners
  if (overlay) overlay.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove overlay elements
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  if (sizeIndicator) {
    sizeIndicator.remove();
    sizeIndicator = null;
  }
}

// Show success feedback
function showCaptureSuccess() {
  const toast = document.createElement('div');
  toast.className = 'receiptwise-toast receiptwise-toast-success';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>Uploading receipt to ReceiptWise...</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show error feedback
function showCaptureError(message) {
  const toast = document.createElement('div');
  toast.className = 'receiptwise-toast receiptwise-toast-error';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <span>${message || 'Failed to capture receipt'}</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
