#!/usr/bin/env node

/**
 * Build script for the Chrome extension
 * Copies extension files to dist/extension and creates a zip for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extensionDir = path.join(__dirname, '../extension');
const distDir = path.join(__dirname, '../dist/extension');
const zipFile = path.join(__dirname, '../dist/sk-mock-api-extension.zip');

const filesToCopy = [
  'manifest.json',
  'background',
  'content',
  'popup',
  'icons',
];

// Clean dist directory
function cleanDist() {
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy files
function copyFiles() {
  console.log('📦 Copying extension files...');
  
  filesToCopy.forEach(item => {
    const src = path.join(extensionDir, item);
    const dest = path.join(distDir, item);
    
    if (!fs.existsSync(src)) {
      console.warn(`⚠️  Warning: ${item} not found, skipping...`);
      return;
    }
    
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDirectory(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  });
  
  console.log('✅ Files copied successfully');
}

// Recursively copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create zip file
function createZip() {
  console.log('📦 Creating zip file...');
  
  try {
    // Use zip command if available
    const zipDir = path.dirname(distDir);
    const zipName = path.basename(distDir);
    
    process.chdir(zipDir);
    execSync(`zip -r ${path.basename(zipFile)} ${zipName}`, { stdio: 'inherit' });
    console.log(`✅ Zip file created: ${zipFile}`);
  } catch (error) {
    console.warn('⚠️  Could not create zip file (zip command not found)');
    console.log('💡 You can manually zip the dist/extension folder');
  }
}

// Main build function
function build() {
  console.log('🚀 Building browser extension...\n');
  
  cleanDist();
  copyFiles();
  createZip();
  
  console.log('\n✅ Build complete!');
  console.log(`📁 Extension ready in: ${distDir}`);
  console.log(`📦 Zip file: ${zipFile}`);
  console.log('\n💡 To install:');
  console.log('   1. Go to chrome://extensions/');
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log(`   4. Select: ${distDir}`);
}

build();
