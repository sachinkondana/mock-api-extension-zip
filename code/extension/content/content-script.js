// Interceptor runs in MAIN world and/or via injected script. We push config via postMessage and custom event.
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
  const payload = { mockApis, mockEnabled, groupEnabled };
  window.postMessage({ source: 'sk-mock-api', type: 'config', ...payload }, '*');
  try {
    window.dispatchEvent(new CustomEvent('sk-mock-api-config', { detail: payload }));
  } catch (_) {}
}

// Push config as soon as content script loads so MAIN world / injected interceptor gets it
sendConfigToPage();

// Fallback: inject interceptor via script tag (runs in page context) for fetch override
(function () {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/interceptor.js');
  script.onload = function () { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
})();

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
