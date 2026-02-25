// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    chrome.storage.local.set({ mockEnabled: request.enabled }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getStatus') {
    chrome.storage.local.get(['mockEnabled'], (result) => {
      const enabled = result.mockEnabled !== false;
      sendResponse({ enabled });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getMockData') {
    // This is handled by the interceptor script now
    sendResponse({ data: null });
    return true;
  }
});

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

const DEFAULT_MOCK_APIS = [
  {
    id: generateId(),
    urlPattern: 'https://api.example.com/news/*',
    method: 'GET',
    enabled: true,
    statusCode: 200,
    delayMs: 0,
    responseBody: '{}',
    label: 'Get news by ID',
  },
  {
    id: generateId(),
    urlPattern: 'https://api.example.com/news/*/comments',
    method: 'GET',
    enabled: true,
    statusCode: 200,
    delayMs: 0,
    responseBody: '{"data":[],"pagination":{"page":1,"limit":10,"count":0}}',
    label: 'Get comments by news ID',
  },
  {
    id: generateId(),
    urlPattern: 'https://api.example.com/category/*/news',
    method: 'GET',
    enabled: true,
    statusCode: 200,
    delayMs: 0,
    responseBody: '{"data":[],"pagination":{"page":1,"limit":10,"count":0}}',
    label: 'Get news by category ID',
  },
  {
    id: generateId(),
    urlPattern: 'https://api.example.com/categories',
    method: 'GET',
    enabled: true,
    statusCode: 200,
    delayMs: 0,
    responseBody: '{"data":[],"pagination":{"page":1,"limit":10,"count":0}}',
    label: 'List of categories',
  },
];

// Initialize: set default enabled state and seed mock APIs when missing
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['mockEnabled', 'mockApis'], (result) => {
    const updates = {};
    if (result.mockEnabled === undefined) {
      updates.mockEnabled = true;
    }
    if (
      result.mockApis === undefined ||
      (Array.isArray(result.mockApis) && result.mockApis.length === 0)
    ) {
      updates.mockApis = DEFAULT_MOCK_APIS;
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});
