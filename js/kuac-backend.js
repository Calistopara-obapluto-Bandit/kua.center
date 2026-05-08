window.KUAC_BACKEND = (function () {
  const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';

  function apiUrl(path) {
    return path;
  }

  async function request(path, options) {
    if (!isHttp || typeof fetch !== 'function') {
      return null;
    }

    const response = await fetch(apiUrl(path), Object.assign({
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }, options || {}));

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const error = new Error(errorText || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
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
    available: isHttp && typeof fetch === 'function',
    request,
    fileToDataUrl,
    fetchState: () => request('/api/state'),
    fetchSubmission: (email, caseCode) => request(`/api/submission?email=${encodeURIComponent(email)}&caseCode=${encodeURIComponent(caseCode)}`),
    postSubmission: (payload) => request('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
    postIssuedCode: (payload) => request('/api/agent/issue', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  });
})();
