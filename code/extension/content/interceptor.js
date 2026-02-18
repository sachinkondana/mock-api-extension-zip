// This script runs in the page context to intercept fetch and XHR
(function() {
  'use strict';

  // Mock data - will be synced from TypeScript files
  const mockData = {
  getMaterial: {
    "id": "019c3ec6-fda4-75fa-8bca-eb3551dda14a",
    "name": "RHENODIV BO-7665-1",
    "description": "SI",
    "comments": "SI",
    "producerName": null,
    "producerPlantName": null,
    "producerId": null,
    "producerPlantId": null,
    "class1Id": "CRM",
    "class2Id": null,
    "chemremsyCode": "EC2600010012",
    "gateApprovalStatusId": null,
    "SAP_XPlantStatus": null,
    "6DigitCode": "CZ1619",
    "8DigitCode": "CZ161901",
    "uom": null,
    "isDraft": false,
    "createdAt": "2026-02-08 19:42:34.378",
    "updatedAt": "2026-02-08 19:42:34.378",
    "crmProperties": {
      "id": "019c3ed2-e1b8-71cf-8453-8491c6f2e080",
      "class3Id": null,
      "density": "2.000000",
      "appearance": "Powder",
      "shelfLifeInDays": 365,
      "polymerContent": null,
      "rubberContent": "0",
      "solidsContent": null,
      "ncoContent": null
    },
    "specifications": []
  },

  // {
  //   id: '81f71cd2-30dd-4407-93e3-b715ac32490c',
  //   name: 'N',
  //   description: '',
  //   comments: '1',
  //   producerName: 'CONTITECH ELASTOMERE BESCHICHTUNGEN',
  //   producerPlantName: 'Volgograd',
  //   producerId: 'c22438b8-6ebd-4c5c-8d29-08527c0ba723',
  //   producerPlantId: '448555ee-15b0-4acc-ae63-9c72985b57a8',
  //   class1Id: 'CRM',
  //   class2Id: 'STANDARD',
  //   chemremsyCode: 'EC2600000015',
  //   gateApprovalStatusId: 'RM60',
  //   SAP_XPlantStatus: '',
  //   '6DigitCode': 'EC2600',
  //   '8DigitCode': null,
  //   uom: null,
  //   isDraft: false,
  //   createdAt: '2026-01-29 10:26:33.811717',
  //   updatedAt: '2026-01-30 18:07:23.766210',
  //   crmProperties: {
  //     id: '9e881aeb-e568-410d-8488-b3b34774ca2a',
  //     class3Id: 'CA11',
  //     density: '1.000000',
  //     appearance: 'Bags, blue',
  //     shelfLifeInDays: 1,
  //     polymerContent: null,
  //     rubberContent: null,
  //     solidsContent: null,
  //     ncoContent: null,
  //   },
  //   specifications: [
  //     {
  //       id: '019c36cb-c05e-73b8-ad26-c0122e74e0a2',
  //       name: 'C12 - C15',
  //       text: 'C12 - C15',
  //       unit: '%',
  //       active: true,
  //       comments: '',
  //       maxValue: 99.9,
  //       minValue: -99.9,
  //       sequence: null,
  //       footNotes: [],
  //       minMaxType: 'Absolute',
  //       propertyId: 478,
  //       testMethod: '1.3-21',
  //       targetUnset: false,
  //       targetValue: null,
  //       propertyType: 'numeric',
  //       testCondition: '',
  //       externalTestMethod: '',
  //       propertyDefinition: 'C12 - C15',
  //       propertyFolderName: 'BASIS FISHOIL',
  //       materialSpecificationVersionId: '019c36cb-c05e-73b8-ad26-bdc11f6ff7cf',
  //     },
  //   ],
  // },

  getMaterialSpecificationVersions: {
    data: [
      {
        specificationId: '019c13d4-c1ce-7b66-8bee-f4b4a329bbe8',
        specificationVersionId: '019c13f5-af78-7442-b57a-dca541a0c067',
        versionNumber: '',
        status: 'DRAFT',
        density: '1.20',
        shelfLifeInDays: 365,
        appearance: '019c13c3-7b7b-7cce-b720-3a6af2c36dd9',
        approvalCategory: 'CT-A',
        chemicalComposition: '',
        comments: 'Added v2 specification properties',
        createdBy: 'John Doe',
      },
      {
        specificationId: '019c13d4-c1ce-7b66-8bee-f4b4a329bbe8',
        specificationVersionId: '019c17eb-dae9-789b-96ee-a0685a0bd945',
        versionNumber: 1,
        status: 'RELEASED',
        density: '1.20',
        shelfLifeInDays: 365,
        appearance: '019c13c3-7b7b-7cce-b720-3a6af2c36dd9',
        approvalCategory: 'CT-A',
        chemicalComposition: '',
        comments: '',
        releaseNote: 'Approved by QA and compliance',
        releasedBy: 'John Doe',
        createdBy: 'John Doe',
        createdAt: '2026-01-30T10:20:10Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      count: 2,
    },
  },

  getMaterialSpecVersionDetail: {
    specificationId: '019c13d4-c1ce-7b66-8bee-f4b4a329bbe8',
    specificationVersionId: '019c13f5-af78-7442-b57a-dca541a0c067',
    versionNumber: 2,
    status: 'DRAFT',
    density: '1.20',
    shelfLifeInDays: 365,
    appearance: '019c13c3-7b7b-7cce-b720-3a6af2c36dd9',
    approvalCategory: 'CT-A',
    chemicalComposition: '',
    remarks: [
      {
        id: '1',
        remark:
          'In addition to the fulfillment of all parameters in this specification, the supplier guarantees, that the delivered material is identical to the original samples submitted during the approval process of the material.',
      },
    ],
    properties: [
      {
        propertyId: 101,
        unit: 'g/cm3',
        targetValue: 1.2,
        minValue: 1.18,
        maxValue: 1.22,
        targetUnset: false,
        value: null,
        text: null,
        testMethod: 'ASTM D792',
        testCondition: '23°C',
        externalTestMethod: null,
        footnotes: ['c1f1c0f5-1e8e-4b8d-bd2a-91b4f68e9a01', 'd2b3a0aa-9a11-4e98-812c-71a72d99a991'],
      },
    ],
    createdBy: 'John Doe',
    updatedAt: '2026-01-31T10:25:40Z',
    createdAt: '2026-01-31T10:25:40Z',
  },

  getSpecifications: {
    data: [
      {
        specificationId: '019b89cb-7178-7da1-b514-1ce358d33e20',
        class1Id: 'CRM',
        groupCode: 'CA11',
        specificationCode: 'CA1105',
        name: 'Polycarbonate UV Resistant',
        latestVersion: {
          versionNumber: 2,
          status: 'DRAFT',
          denisty: '1.15',
          apperance: '',
        },
        releasedVersion: {
          versionNumber: 1,
          releasedBy: 'John, Doe',
          releaseDate: '2021-09-02T10:15:45Z',
        },
        createdBy: 'John, Doe',
        createdAt: '2021-09-01T07:46:13Z',
        updatedAt: '2021-09-05T08:12:20Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      count: 1,
    },
  },

};

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
