const fs = require('fs');
const path = require('path');

/**
 * Flux Merge Asset Auditor
 * Verifies that assets referenced in the codebase exist on disk.
 */

const ASSET_ROOTS = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../src/assets'),
];

const assetsToVerify = [];

// 1. Scan for common asset extensions in the project
const scanDir = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(png|jpg|jpeg|gif|svg|mp3|wav|ogg)$/i.test(file)) {
      assetsToVerify.push(file);
    }
  });
};

// We scan public and src/assets to see what we HAVE
ASSET_ROOTS.forEach(root => {
  if (fs.existsSync(root)) {
    scanDir(root);
  }
});

// 2. Check for specific critical assets (placeholders for logic that would scan constants.ts)
// In this specific game, most visuals are procedurally generated (Three.js).
// We verify the a few known static assets.
const criticalAssets = [
  'favicon.svg',
  'icons.svg',
  'hero.png',
  'typescript.svg',
  'vite.svg',
];

let missingCount = 0;
console.log('🔍 Starting Asset Audit...');

criticalAssets.forEach(asset => {
  let found = false;
  for (const root of ASSET_ROOTS) {
    if (fs.existsSync(path.join(root, asset))) {
      found = true;
      break;
    }
  }

  if (!found) {
    console.error(`❌ Missing critical asset: ${asset}`);
    missingCount++;
  } else {
    console.log(`✅ Found: ${asset}`);
  }
});

if (missingCount > 0) {
  console.error(`\n🚨 Asset Audit Failed: ${missingCount} assets missing.`);
  process.exit(1);
} else {
  console.log('\n✨ Asset Audit Passed: All critical assets found.');
  process.exit(0);
}
