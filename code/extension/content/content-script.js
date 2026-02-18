// Inject interceptor script into page context
(function() {
  // Inject immediately, before page scripts run
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/interceptor.js');
  script.onload = function() {
    console.log('[sk-mockAPI] Interceptor script loaded');
    this.remove();
  };
  script.onerror = function() {
    console.error('[sk-mockAPI] Failed to load interceptor script');
  };
  
  // Inject as early as possible
  if (document.head) {
    document.head.appendChild(script);
  } else {
    (document.documentElement || document).appendChild(script);
  }
})();

async function sendConfigToPage() {
  const result = await chrome.storage.local.get(['mockApis', 'mockEnabled', 'apiGroups', 'ungroupedEnabled']);
  const mockApis = result.mockApis || [];
  const mockEnabled = result.mockEnabled !== false;
  const apiGroups = Array.isArray(result.apiGroups) ? result.apiGroups : [];
  const ungroupedEnabled = result.ungroupedEnabled !== false;
  const groupEnabled = { '__ungrouped__': ungroupedEnabled };
  apiGroups.forEach(function (g) {
    groupEnabled[g.id] = g.enabled !== false;
  });
  window.postMessage({
    source: 'sk-mock-api',
    type: 'config',
    mockApis,
    mockEnabled,
    groupEnabled
  }, '*');
}

// Listen for messages from injected script
window.addEventListener('message', async function(event) {
  // Only accept messages from our injected script
  if (event.source !== window || !event.data || event.data.source !== 'sk-mock-api') {
    return;
  }

  if (event.data.type === 'getConfig' || event.data.type === 'checkEnabled') {
    await sendConfigToPage();
    return;
  }

  if (event.data.type === 'getMockData') {
    const route = event.data.route;
    chrome.runtime.sendMessage({
      action: 'getMockData',
      route: route
    }, (response) => {
      window.postMessage({
        source: 'sk-mock-api',
        type: 'mockResponse',
        requestId: event.data.requestId,
        data: response.data
      }, '*');
    });
  }
});

// When storage changes, push config to page so interceptor updates without reload
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.mockApis || changes.mockEnabled || changes.apiGroups || changes.ungroupedEnabled) {
    sendConfigToPage();
  }
});
