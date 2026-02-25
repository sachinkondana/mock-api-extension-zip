// This script runs in the page context to intercept fetch and XHR
(function() {
  'use strict';

  // Dynamic config from storage (injected by content script)
  let enabled = true;
  let apiList = [];
  let groupEnabled = { '__ungrouped__': true };

  function requestConfig() {
    window.postMessage({ source: 'sk-mock-api', type: 'getConfig' }, '*');
  }

  window.addEventListener('message', function(event) {
    if (event.data && event.data.source === 'sk-mock-api') {
      if (event.data.type === 'config') {
        enabled = event.data.mockEnabled !== false;
        apiList = Array.isArray(event.data.mockApis) ? event.data.mockApis : [];
        groupEnabled = event.data.groupEnabled && typeof event.data.groupEnabled === 'object' ? event.data.groupEnabled : { '__ungrouped__': true };
      }
      if (event.data.type === 'enabledStatus') {
        enabled = event.data.enabled;
      }
    }
  });

  // Convert URL pattern with * to regex (one path segment per *)
  function urlPatternToRegex(urlPattern) {
    let pathname = urlPattern;
    let patternOrigin = null;
    if (urlPattern.startsWith('http://') || urlPattern.startsWith('https://')) {
      try {
        const u = new URL(urlPattern);
        patternOrigin = u.origin;
        pathname = u.pathname;
      } catch (e) {
        pathname = urlPattern;
      }
    }
    const escaped = pathname.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = '^' + escaped.replace(/\*/g, '[^/]+') + '$';
    return { regex: new RegExp(regexStr), patternOrigin };
  }

  function findMatchingApi(urlString, method) {
    try {
      let urlObj;
      if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
        urlObj = new URL(urlString);
      } else {
        urlObj = new URL(urlString, window.location.href);
      }
      const requestPathname = urlObj.pathname;
      const requestOrigin = urlObj.origin;
      const requestMethod = (method || 'GET').toUpperCase();

      for (const api of apiList) {
        if (!api.enabled) continue;
        const groupKey = api.groupId || '__ungrouped__';
        if (groupEnabled[groupKey] === false) continue;
        const apiMethod = (api.method || 'GET').toUpperCase();
        if (apiMethod !== requestMethod) continue;

        const { regex, patternOrigin } = urlPatternToRegex(api.urlPattern || '');
        if (!regex.test(requestPathname)) continue;
        if (patternOrigin != null && patternOrigin !== requestOrigin) continue;

        return api;
      }
    } catch (e) {
      console.error('[sk-mockAPI] Error parsing URL:', urlString, e);
    }
    return null;
  }

  // Intercept Fetch API
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const method = (url instanceof Request ? url.method : 'GET') || 'GET';

    if (!enabled) {
      return originalFetch.apply(this, args);
    }

    let urlString;
    if (typeof url === 'string') {
      urlString = url;
    } else if (url instanceof Request) {
      urlString = url.url;
    } else {
      urlString = String(url);
    }

    const api = findMatchingApi(urlString, method);
    if (api) {
      console.log(`[sk-mockAPI] ✅ Intercepting fetch: ${urlString}`);
      const statusCode = api.statusCode != null ? api.statusCode : 200;
      const delayMs = Math.max(0, parseInt(api.delayMs, 10) || 0);
      let body = api.responseBody;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (_) {}
      }
      const responseBody = body != null ? JSON.stringify(body) : '{}';

      const doRespond = () => {
        return new Response(responseBody, {
          status: statusCode,
          statusText: statusCode === 200 ? 'OK' : String(statusCode),
          headers: { 'Content-Type': 'application/json' },
        });
      };

      if (delayMs > 0) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(doRespond());
          }, delayMs);
        });
      }
      return Promise.resolve(doRespond());
    }

    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    this._method = method;
    this._mockApi = null;
    if (enabled) {
      this._mockApi = findMatchingApi(url, method);
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    if (!enabled || !this._url) {
      return originalSend.apply(this, args);
    }

    const api = this._mockApi;
    if (api) {
      console.log(`[sk-mockAPI] ✅ Intercepting XHR: ${this._url}`);
      const statusCode = api.statusCode != null ? api.statusCode : 200;
      const delayMs = Math.max(0, parseInt(api.delayMs, 10) || 0);
      let body = api.responseBody;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (_) {}
      }
      const responseText = body != null ? JSON.stringify(body) : '{}';

      const applyResponse = () => {
        Object.defineProperty(this, 'responseText', { writable: false, configurable: true, value: responseText });
        Object.defineProperty(this, 'response', { writable: false, configurable: true, value: responseText });
        Object.defineProperty(this, 'status', { writable: false, configurable: true, value: statusCode });
        Object.defineProperty(this, 'statusText', { writable: false, configurable: true, value: statusCode === 200 ? 'OK' : String(statusCode) });
        Object.defineProperty(this, 'readyState', { writable: false, configurable: true, value: XMLHttpRequest.DONE });
        this.getAllResponseHeaders = function() { return 'content-type: application/json\r\n'; };
        this.getResponseHeader = function(name) {
          return name.toLowerCase() === 'content-type' ? 'application/json' : null;
        };
        this.dispatchEvent(new Event('readystatechange'));
        this.dispatchEvent(new Event('load'));
        this.dispatchEvent(new Event('loadend'));
      };

      if (delayMs > 0) {
        setTimeout(applyResponse, delayMs);
      } else {
        applyResponse();
      }
      return;
    }

    return originalSend.apply(this, args);
  };

  requestConfig();
  console.log('[sk-mockAPI] ✅ Interceptor initialized (config-driven)');
})();
