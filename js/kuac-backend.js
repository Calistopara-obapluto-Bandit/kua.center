window.KUAC_BACKEND = (function () {
  const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  const config = window.KUAC_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || config.callbackEndpoint || '').trim().replace(/\/$/, '');

  function getApiBaseUrl() {
    if (!apiBaseUrl) {
      return '';
    }

    try {
      const currentUrl = new URL(window.location.href);
      const apiUrl = new URL(apiBaseUrl);
      if (currentUrl.origin === apiUrl.origin) {
        return '';
      }
    } catch (error) {
      // Fall back to the configured API base URL.
    }

    return apiBaseUrl;
  }

  function apiUrl(path) {
    const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
    const baseUrl = getApiBaseUrl();
    return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
  }

  async function request(path, options) {
    if (!isHttp || typeof fetch !== 'function') {
      return null;
    }

    const response = await fetch(apiUrl(path), Object.assign({
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    }, options || {}));

    const rawBody = await response.text().catch(() => '');

    if (!response.ok) {
      const error = new Error(rawBody || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    try {
      return rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      const parseError = new Error(rawBody ? `Unexpected response: ${rawBody}` : 'Unexpected empty response');
      parseError.status = response.status;
      throw parseError;
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
  }

  return Object.freeze({
    available: isHttp && typeof fetch === 'function' && Boolean(apiBaseUrl),
    request,
    fileToDataUrl,
    fetchState: () => request('/api/state'),
    fetchSubmission: (email, caseCode) => request(`/api/support/ticket?email=${encodeURIComponent(email)}&caseCode=${encodeURIComponent(caseCode)}`),
    fetchDashboard: (dashboardId) => request(`/api/support/ticket?dashboardId=${encodeURIComponent(dashboardId)}`),
    fetchSupportTicket: (options) => {
      const params = new URLSearchParams();
      if (options && typeof options === 'object') {
        if (options.dashboardId) {
          params.set('dashboardId', String(options.dashboardId).trim());
        }
        if (options.caseCode) {
          params.set('caseCode', String(options.caseCode).trim());
        }
        if (options.email) {
          params.set('email', String(options.email).trim());
        }
      }
      return request(`/api/support/ticket?${params.toString()}`);
    },
    fetchChatMessages: (caseCodeOrOptions) => {
      if (caseCodeOrOptions && typeof caseCodeOrOptions === 'object') {
        const caseCode = String(caseCodeOrOptions.caseCode || '').trim();
        const dashboardId = String(caseCodeOrOptions.dashboardId || '').trim();
        const params = new URLSearchParams();
        if (caseCode) {
          params.set('caseCode', caseCode);
        }
        if (dashboardId) {
          params.set('dashboardId', dashboardId);
        }
        return request(`/api/support/ticket?${params.toString()}`);
      }

      return request(`/api/support/ticket?caseCode=${encodeURIComponent(caseCodeOrOptions)}`);
    },
    postSubmission: (payload) => request('/api/support/ticket', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
    postIssuedCode: (payload) => request('/api/support/ticket/status', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
    postChatMessage: (payload) => request('/api/support/ticket/messages', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  });
})();
