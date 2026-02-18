# Extension Not Loading - Fix Guide

## Problem
Extension content script not injecting into application pages.

## Root Cause
Content script was only configured to run on target domains, but needs to run on ALL pages to intercept requests FROM any page TO target domains.

## Solution Applied
Changed `content_scripts.matches` from specific domains to `<all_urls>`.

## Steps to Fix

### 1. Reload Extension
1. Go to `chrome://extensions/`
2. Find "sk-mockAPI(developed by sachinkondana)"
3. Click the **reload icon** (🔄)
4. This applies the updated manifest.json

### 2. Verify Extension is Enabled
1. Click extension icon in toolbar
2. Toggle should be **ON** (green)
3. Status should show **"ENABLED"**

### 3. Check Content Script Injection
Open browser console (F12) and look for:
- `[sk-mockAPI] Interceptor script loaded`
- `[sk-mockAPI] ✅ Interceptor initialized and ready`

**If you DON'T see these messages:**
- Extension might not be enabled
- Content script might not be running
- Try reloading extension again

### 4. Test Interception
In browser console, run:
```javascript
fetch('https://api.example.com/materials/81f71cd2-30dd-4407-93e3-b715ac32490c')
  .then(r => r.json())
  .then(data => console.log('✅ Mock data:', data))
  .catch(err => console.error('❌ Error:', err));
```

**Expected output:**
```
[sk-mockAPI] Checking URL: https://api.example.com/materials/... -> pathname: /materials/...
[sk-mockAPI] Route matched: /materials/...
[sk-mockAPI] ✅ Intercepting fetch: https://api.example.com/materials/...
[sk-mockAPI] ✅ Returning mock response for: https://api.example.com/materials/...
✅ Mock data: {id: "81f71cd2-30dd-4407-93e3-b715ac32490c", name: "N", ...}
```

## Troubleshooting

### Still Not Loading?

1. **Check Extension Errors:**
   - Go to `chrome://extensions/`
   - Click "Errors" button if visible
   - Fix any manifest or script errors

2. **Verify Files Exist:**
   ```bash
   ls extension/content/content-script.js
   ls extension/content/interceptor.js
   ```
   Both files should exist.

3. **Regenerate Extension:**
   ```bash
   npm run extension:generate
   npm run extension:sync
   ```
   Then reload extension.

4. **Remove and Re-add:**
   - Remove extension from `chrome://extensions/`
   - Click "Load unpacked"
   - Select `extension/` folder again

5. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for extension-related errors

## How It Works Now

1. **Content Script Runs:** On ALL pages (`<all_urls>`)
2. **Injects Interceptor:** Into page context before page scripts
3. **Intercepts Requests:** Only requests TO target domains
4. **Returns Mock Data:** For matching routes

## Verification Checklist

- [ ] Extension loaded in `chrome://extensions/`
- [ ] Extension enabled (toggle ON)
- [ ] Console shows "Interceptor initialized"
- [ ] Test fetch returns mock data
- [ ] No errors in console
