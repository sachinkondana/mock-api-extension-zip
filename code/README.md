# sk-mockAPI Chrome Extension

Chrome extension that intercepts API calls and returns mock responses. Configure rules in the popup to enable/disable and customize responses per URL pattern.

## Structure

```
├── extension/
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.js
│   ├── content/
│   │   ├── content-script.js
│   │   └── interceptor.js
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   └── icons/
├── scripts/
│   └── build-extension.js
├── package.json
└── README.md
```

## Build

```bash
npm run build
```

Output:
- `dist/extension/` – unpacked extension folder
- `dist/sk-mock-api-extension.zip` – zip for distribution

## Install

1. Open `chrome://extensions/`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Choose the `dist/extension` folder

## Usage

Use the extension popup to add or edit interception rules (URL pattern, method, status code, response body, delay). The extension injects the interceptor into pages and returns mock responses for matching requests.
