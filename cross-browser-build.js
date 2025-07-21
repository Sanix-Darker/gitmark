#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Build configurations for different browsers
const buildConfigs = {
  chrome: {
    manifest: 'manifest.json',
    outputDir: 'dist-chrome'
  },
  firefox: {
    manifest: 'manifest-v2.json',
    outputDir: 'dist-firefox'
  },
  safari: {
    manifest: 'safari-manifest.json',
    outputDir: 'dist-safari'
  }
};

// Files to copy for all browsers
const commonFiles = [
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'styles.css',
  'icons/'
];

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyFile(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function buildForBrowser(browser, config) {
  console.log(`Building for ${browser}...`);

  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Copy manifest
  fs.copyFileSync(config.manifest, path.join(config.outputDir, 'manifest.json'));

  // Copy common files
  commonFiles.forEach(file => {
    const src = file;
    const dest = path.join(config.outputDir, file);

    if (fs.existsSync(src)) {
      copyFile(src, dest);
    } else {
      console.warn(`Warning: ${src} not found, skipping...`);
    }
  });

  console.log(`✅ ${browser} build completed in ${config.outputDir}/`);
}

// Build for all browsers
Object.entries(buildConfigs).forEach(([browser, config]) => {
  buildForBrowser(browser, config);
});

console.log('\n🎉 All browser builds completed!');
console.log('\nNext steps:');
console.log('1. Chrome: Load dist-chrome/ as unpacked extension');
console.log('2. Firefox: Submit dist-firefox/ to Mozilla Add-ons');
console.log('3. Safari: Use dist-safari/ with Xcode Safari Extension project');
