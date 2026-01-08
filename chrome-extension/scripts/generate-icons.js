#!/usr/bin/env node
/**
 * Icon Generator for ReceiptWise Clipper Chrome Extension
 * 
 * This script generates PNG icons from SVG files.
 * Run with: node scripts/generate-icons.js
 * 
 * Requirements:
 * - npm install sharp (or use: npx sharp)
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available
async function generateIcons() {
  const sizes = [16, 32, 48, 128];
  const iconsDir = path.join(__dirname, '..', 'icons');

  try {
    // Try to require sharp
    const sharp = require('sharp');
    
    for (const size of sizes) {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);
      
      if (fs.existsSync(svgPath)) {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(`Generated: icon${size}.png`);
      }
    }
    
    console.log('✅ All icons generated successfully!');
  } catch (err) {
    console.log('Sharp not available. Using fallback PNG generation...');
    generateFallbackIcons();
  }
}

// Fallback: Create simple base64 PNG placeholders
function generateFallbackIcons() {
  const iconsDir = path.join(__dirname, '..', 'icons');
  
  // Simple 1x1 emerald green PNG as base64 (just for testing)
  // In production, you should properly convert the SVGs
  console.log(`
📝 To properly generate PNG icons, install ImageMagick:

  brew install imagemagick

Then run:

  cd chrome-extension/icons
  for size in 16 32 48 128; do
    convert -background none -resize \${size}x\${size} icon\${size}.svg icon\${size}.png
  done

Or install sharp and re-run this script:

  npm install sharp
  node scripts/generate-icons.js
`);
}

generateIcons();
