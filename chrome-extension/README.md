# ReceiptWise Clipper - Chrome Extension

A Chrome extension that allows users to quickly capture receipts from anywhere on the web and upload them directly to ReceiptWise.

## Features

- **Snipping Tool**: Click and drag to select any area of a webpage to capture as a receipt
- **Keyboard Shortcuts**: 
  - Mac: `⌃ + ⇧ + R` (Control + Shift + R)
  - Windows/Linux: `Alt + Shift + R`
- **API Key Authentication**: Securely connect to your ReceiptWise account
- **Automatic Processing**: Uploaded receipts are automatically processed with OCR
- **Real-time Notifications**: Get desktop notifications when uploads complete
- **Selection Size Display**: See the dimensions of your selection while capturing

## Installation

### From Chrome Web Store
*(Coming soon)*

### Development Setup

1. Clone/download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **"Developer mode"** in the top right corner
4. Click **"Load unpacked"**
5. Select the `chrome-extension` folder
6. The ReceiptWise Clipper icon should appear in your toolbar
7. (Optional) Pin the extension for easy access

## Setup

1. Click the extension icon in your toolbar
2. Get your API key from [ReceiptWise Settings](https://www.receiptwise.io/settings?tab=integrations)
3. Paste your API key (starts with `rw_`) and click **Connect Account**
4. You're ready to capture receipts!

## Usage

### Capture a Receipt
1. Navigate to any webpage with a receipt
2. Click the extension icon → **Capture Receipt**
   - Or use keyboard shortcut: `⌃⇧R` (Mac) / `Alt+Shift+R` (Windows)
3. Click and drag to select the receipt area
4. Release to upload automatically
5. View your receipt in ReceiptWise

### Tips
- Press `Esc` to cancel a capture
- Minimum selection size is 20×20 pixels
- The selection box shows dimensions while dragging
- Click the notification to open your receipts

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background/
│   └── service-worker.js  # Background script for handling uploads
├── content/
│   ├── content.js         # Content script for screen capture
│   └── content.css        # Styles for capture overlay
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── icons/
    ├── icon16.svg
    ├── icon32.svg
    ├── icon48.svg
    └── icon128.svg
```

## API Endpoints

The extension communicates with these ReceiptWise API endpoints:

- `POST /api/extension/verify` - Verify API key validity
- `POST /api/extension/upload` - Upload receipt image
- `POST /api/extension/process` - Process uploaded receipt with OCR

## Security

- API keys are stored securely using Chrome's `storage.sync` API
- All communication with ReceiptWise uses HTTPS
- API keys can be regenerated at any time from Settings

## Troubleshooting

**Extension not working?**
- Make sure you have an active ReceiptWise Premium subscription
- Try regenerating your API key in Settings > Integrations
- Check that the extension has the necessary permissions

**Capture not starting?**
- Refresh the page and try again
- Some pages may block content scripts (e.g., Chrome Web Store, chrome:// pages)

## License

This extension is part of ReceiptWise and is proprietary software.
