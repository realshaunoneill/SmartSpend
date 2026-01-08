# ReceiptWise Clipper - Chrome Extension

A Chrome extension that allows users to quickly capture receipts from anywhere on the web and upload them directly to ReceiptWise.

## Features

- **Snipping Tool**: Click and drag to select any area of a webpage to capture as a receipt
- **Keyboard Shortcut**: Use `Alt+Shift+R` to quickly start capturing
- **API Key Authentication**: Securely connect to your ReceiptWise account
- **Automatic Processing**: Uploaded receipts are automatically processed with OCR

## Installation

### Development Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension icon should appear in your toolbar

### Building Icons

The extension requires PNG icons. To convert the SVG icons:

```bash
# Using ImageMagick (if installed)
cd chrome-extension/icons
convert icon16.svg icon16.png
convert icon32.svg icon32.png
convert icon48.svg icon48.png
convert icon128.svg icon128.png

# Or use an online SVG to PNG converter
```

Alternatively, you can manually create PNG icons with the ReceiptWise emerald color (#10b981) with a receipt-like design.

## Usage

1. Click the extension icon in your toolbar
2. Enter your API key (get it from Settings > Integrations in ReceiptWise)
3. Click "Capture Receipt" or use the keyboard shortcut `Alt+Shift+R`
4. Click and drag to select the receipt area
5. The receipt will be automatically uploaded and processed

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
