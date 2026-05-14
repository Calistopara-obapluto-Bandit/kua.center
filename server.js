const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'kuac-state.json');
const PORT = Number(process.env.PORT || 3000);
const DASHBOARD_ACCESS_CODE = String(process.env.AGENT_DASHBOARD_PASSWORD || '').trim();
const DASHBOARD_SESSION_COOKIE = 'kuac_admin_session';
const DASHBOARD_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const DEFAULT_STATE = {
  submissions: {},
  issued: {},
  chats: {},
  tickets: {},
  sessions: {},
};

let state = cloneState(DEFAULT_STATE);

function cloneState(source) {
  return {
    submissions: Object.assign({}, source.submissions || {}),
    issued: Object.assign({}, source.issued || {}),
    chats: Object.assign({}, source.chats || {}),
    tickets: Object.assign({}, source.tickets || {}),
    sessions: Object.assign({}, source.sessions || {}),
  };
}

async function ensureStateLoaded() {
  try {
    const raw = await fsp.readFile(DATA_FILE, 'utf8');
    state = cloneState(Object.assign({}, DEFAULT_STATE, JSON.parse(raw)));
  } catch (error) {
    state = cloneState(DEFAULT_STATE);
  }
}

async function saveState() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(DATA_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end();
}

function parseCookies(header) {
  const cookies = {};
  String(header || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const separator = item.indexOf('=');
      if (separator < 0) {
        return;
      }
      const name = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      cookies[name] = decodeURIComponent(value);
    });
  return cookies;
}

function getSessionId(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[DASHBOARD_SESSION_COOKIE] || '';
}

function loadSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const session = state.sessions[sessionId];
  if (!session) {
    return null;
  }

  if (session.expiresAt && Date.now() > Date.parse(session.expiresAt)) {
    delete state.sessions[sessionId];
    return null;
  }

  return session;
}

function isDashboardAuthorized(req) {
  return Boolean(loadSession(getSessionId(req)));
}

function setCookieHeader(name, value, maxAgeSeconds) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (typeof maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  return parts.join('; ');
}

function createDashboardSession() {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DASHBOARD_SESSION_TTL_MS).toISOString();

  state.sessions[sessionId] = {
    createdAt: now.toISOString(),
    expiresAt,
  };

  return {
    sessionId,
    expiresAt,
  };
}

function requireDashboardAuth(req, res, opts = {}) {
  if (isDashboardAuthorized(req)) {
    return true;
  }

  if (opts.redirectToLogin) {
    res.writeHead(302, {
      Location: '/agent-login.html',
      'Cache-Control': 'no-store',
    });
    res.end();
    return false;
  }

  sendJson(res, 401, { ok: false, error: 'Staff authentication required' });
  return false;
}

function readBody(req, limitBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

function readJsonBody(req) {
  return readBody(req).then((body) => {
    if (!body) {
      return {};
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      const err = new Error('Invalid JSON payload');
      err.statusCode = 400;
      throw err;
    }
  });
}

function normalizeCaseKey(email, caseCode) {
  return `${String(email || '').trim().toLowerCase()}::${String(caseCode || '').trim().toUpperCase()}`;
}

function normalizeDashboardId(dashboardId) {
  return String(dashboardId || '').trim().toUpperCase();
}

function publicState() {
  return {
    submissions: Object.assign({}, state.submissions || {}),
    issued: Object.assign({}, state.issued || {}),
    tickets: Object.assign({}, state.tickets || {}),
  };
}

function chatKey(caseCode) {
  return String(caseCode || '').trim().toUpperCase();
}

function hasKnownCase(caseCode) {
  const key = chatKey(caseCode);
  if (!key) {
    return false;
  }

  return Object.values(state.submissions || {}).some((submission) => chatKey(submission.caseCode) === key)
    || Object.values(state.issued || {}).some((issued) => chatKey(issued.caseCode) === key);
}

function findSubmissionByDashboardId(dashboardId) {
  const key = normalizeDashboardId(dashboardId);
  if (!key) {
    return null;
  }

  return Object.values(state.submissions || {}).find((submission) => normalizeDashboardId(submission.dashboardId) === key) || null;
}

function findIssuedByDashboardId(dashboardId) {
  const key = normalizeDashboardId(dashboardId);
  if (!key) {
    return null;
  }

  return Object.values(state.issued || {}).find((issued) => normalizeDashboardId(issued.dashboardId) === key) || null;
}

function findCaseRecordByDashboardId(dashboardId) {
  const submission = findSubmissionByDashboardId(dashboardId);
  const issued = findIssuedByDashboardId(dashboardId);
  const ticket = findSupportTicketByDashboardId(dashboardId);
  const caseCode = chatKey((submission && submission.caseCode) || (issued && issued.caseCode) || '');
  const ticketCaseCode = chatKey((ticket && ticket.caseCode) || '');
  const resolvedCaseCode = caseCode || ticketCaseCode;

  if (!submission && !issued && !ticket && !resolvedCaseCode) {
    return null;
  }

  return {
    dashboardId: normalizeDashboardId(dashboardId),
    caseCode: resolvedCaseCode,
    submission,
    issued,
    ticket,
    messages: resolvedCaseCode ? getChatThread(resolvedCaseCode) : [],
  };
}

function supportTicketKey(dashboardId) {
  return normalizeDashboardId(dashboardId);
}

function findSupportTicketByDashboardId(dashboardId) {
  const key = supportTicketKey(dashboardId);
  if (!key) {
    return null;
  }

  return state.tickets[key] || null;
}

function findSupportTicketByCaseCode(caseCode) {
  const key = chatKey(caseCode);
  if (!key) {
    return null;
  }

  return Object.values(state.tickets || {}).find((ticket) => chatKey(ticket.caseCode) === key) || null;
}

function findSupportTicketByEmailAndCase(email, caseCode) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedCaseCode = chatKey(caseCode);
  if (!normalizedEmail || !normalizedCaseCode) {
    return null;
  }

  return Object.values(state.tickets || {}).find((ticket) => String(ticket.email || '').trim().toLowerCase() === normalizedEmail
    && chatKey(ticket.caseCode) === normalizedCaseCode) || null;
}

function buildSupportTicket(payload, existingTicket = null) {
  const now = new Date().toISOString();
  const dashboardId = normalizeDashboardId(payload.dashboardId || (existingTicket && existingTicket.dashboardId) || '');
  const caseCode = chatKey(payload.caseCode || (existingTicket && existingTicket.caseCode) || '');
  const email = String(payload.email || (existingTicket && existingTicket.email) || '').trim();
  const agent = String(payload.agent || (existingTicket && existingTicket.agent) || 'KUAC Associate').trim() || 'KUAC Associate';
  const clientName = String(payload.clientName || (existingTicket && existingTicket.clientName) || 'Client').trim() || 'Client';
  const role = String(payload.role || (existingTicket && existingTicket.role) || 'Requester').trim() || 'Requester';
  const paymentId = String(payload.paymentId || (existingTicket && existingTicket.paymentId) || '').trim();
  const proofName = String(payload.proofName || (existingTicket && existingTicket.proofName) || '').trim();
  const subject = String(payload.subject || (existingTicket && existingTicket.subject) || '').trim();
  const summary = String(payload.summary || payload.note || (existingTicket && existingTicket.summary) || '').trim();
  const status = String(payload.status || (existingTicket && existingTicket.status) || 'open').trim() || 'open';
  const priority = String(payload.priority || (existingTicket && existingTicket.priority) || 'normal').trim() || 'normal';

  return {
    dashboardId,
    caseCode,
    email,
    agent,
    clientName,
    role,
    paymentId,
    proofName,
    subject,
    summary,
    status,
    priority,
    createdAt: (existingTicket && existingTicket.createdAt) || now,
    updatedAt: now,
    lastMessageAt: (existingTicket && existingTicket.lastMessageAt) || null,
    accessCode: String(payload.accessCode || (existingTicket && existingTicket.accessCode) || '').trim(),
  };
}

function saveSupportTicket(ticket) {
  if (!ticket || !ticket.dashboardId) {
    return null;
  }

  state.tickets[supportTicketKey(ticket.dashboardId)] = ticket;
  return state.tickets[supportTicketKey(ticket.dashboardId)];
}

function upsertSupportTicket(payload) {
  const dashboardId = normalizeDashboardId(payload.dashboardId);
  const caseCode = chatKey(payload.caseCode);
  const email = String(payload.email || '').trim();
  const existing =
    findSupportTicketByDashboardId(dashboardId) ||
    findSupportTicketByCaseCode(caseCode) ||
    findSupportTicketByEmailAndCase(email, caseCode) ||
    null;
  const ticket = buildSupportTicket(payload, existing);

  if (!ticket.dashboardId) {
    const err = new Error('Dashboard ID is required');
    err.statusCode = 400;
    throw err;
  }

  if (!ticket.caseCode) {
    const fallbackCase = existing && existing.caseCode ? existing.caseCode : '';
    ticket.caseCode = fallbackCase;
  }

  saveSupportTicket(ticket);
  return ticket;
}

function updateSupportTicketStatus(payload) {
  const dashboardId = normalizeDashboardId(payload.dashboardId);
  const caseCode = chatKey(payload.caseCode);
  const ticket =
    findSupportTicketByDashboardId(dashboardId) ||
    findSupportTicketByCaseCode(caseCode) ||
    findSupportTicketByEmailAndCase(payload.email, caseCode);

  if (!ticket) {
    const err = new Error('Support ticket not found');
    err.statusCode = 404;
    throw err;
  }

  const updated = buildSupportTicket({
    dashboardId: ticket.dashboardId,
    caseCode: ticket.caseCode,
    email: ticket.email,
    agent: ticket.agent,
    clientName: ticket.clientName,
    role: ticket.role,
    paymentId: ticket.paymentId,
    proofName: ticket.proofName,
    subject: ticket.subject,
    summary: ticket.summary,
    priority: ticket.priority,
    accessCode: ticket.accessCode,
    status: payload.status || ticket.status,
  }, ticket);

  saveSupportTicket(updated);
  return updated;
}

function appendSupportTicketMessage(payload) {
  const ticket = resolveSupportTicket(payload);
  if (!ticket) {
    const err = new Error('Support ticket not found');
    err.statusCode = 404;
    throw err;
  }

  const message = appendChatMessage(Object.assign({}, payload, {
    dashboardId: ticket.dashboardId,
    caseCode: ticket.caseCode,
  }));

  ticket.lastMessageAt = message.createdAt;
  ticket.updatedAt = message.createdAt;
  ticket.status = String(payload.status || ticket.status || 'open').trim() || 'open';
  saveSupportTicket(ticket);
  return message;
}

function resolveSupportTicket(payload = {}) {
  const dashboardId = normalizeDashboardId(payload.dashboardId);
  const caseCode = chatKey(payload.caseCode);
  const email = String(payload.email || '').trim();

  return findSupportTicketByDashboardId(dashboardId)
    || findSupportTicketByCaseCode(caseCode)
    || findSupportTicketByEmailAndCase(email, caseCode)
    || null;
}

function getChatThread(caseCode) {
  const key = chatKey(caseCode);
  if (!key) {
    return [];
  }

  return Array.isArray(state.chats[key]) ? state.chats[key] : [];
}

function saveChatThread(caseCode, messages) {
  const key = chatKey(caseCode);
  if (!key) {
    return [];
  }

  state.chats[key] = Array.isArray(messages) ? messages : [];
  return state.chats[key];
}

function appendChatMessage(payload) {
  const requestedCaseCode = String(payload.caseCode || '').trim().toUpperCase();
  const dashboardId = normalizeDashboardId(payload.dashboardId);
  const lookup = dashboardId ? findCaseRecordByDashboardId(dashboardId) : null;
  const caseCode = requestedCaseCode || (lookup && lookup.caseCode) || '';
  const text = String(payload.text || '').trim();
  const sender = String(payload.sender || 'KUAC Client').trim() || 'KUAC Client';
  const role = String(payload.role || 'Client').trim() || 'Client';
  const type = String(payload.type || 'user').trim() || 'user';

  if (!caseCode || !text) {
    const err = new Error('Case code and message text are required');
    err.statusCode = 400;
    throw err;
  }

  if (!hasKnownCase(caseCode)) {
    const err = new Error('Case code not found');
    err.statusCode = 404;
    throw err;
  }

  const thread = getChatThread(caseCode);
  const message = {
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex'),
    caseCode,
    sender,
    role,
    type,
    text,
    createdAt: new Date().toISOString(),
  };

  thread.push(message);
  saveChatThread(caseCode, thread);
  return message;
}

function upsertSubmission(payload) {
  const email = String(payload.email || '').trim();
  const caseCode = String(payload.caseCode || '').trim().toUpperCase();
  const dashboardId = String(payload.dashboardId || '').trim();
  const key = normalizeCaseKey(email, caseCode);

  if (!email || !caseCode) {
    const err = new Error('Email and case code are required');
    err.statusCode = 400;
    throw err;
  }

  state.submissions[key] = {
    email,
    caseCode,
    dashboardId,
    paymentId: String(payload.paymentId || '').trim(),
    agent: String(payload.agent || 'KUAC Associate').trim() || 'KUAC Associate',
    clientName: String(payload.clientName || 'Client').trim() || 'Client',
    role: String(payload.role || 'Requester').trim() || 'Requester',
    proofName: String(payload.proofName || '').trim(),
    proofDataUrl: String(payload.proofDataUrl || '').trim(),
    proofType: String(payload.proofType || '').trim(),
    proofSize: Number(payload.proofSize || 0) || 0,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    note: String(payload.note || '').trim(),
  };

  upsertSupportTicket({
    dashboardId,
    caseCode,
    email,
    agent: state.submissions[key].agent,
    clientName: state.submissions[key].clientName,
    role: state.submissions[key].role,
    paymentId: state.submissions[key].paymentId,
    proofName: state.submissions[key].proofName,
    summary: state.submissions[key].note || `Support request for ${caseCode}`,
    status: 'open',
    priority: String(payload.priority || 'normal').trim() || 'normal',
  });

  return state.submissions[key];
}

function isAccessCodeTaken(code, ignoreKey = '') {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const normalizedIgnoreKey = normalizeCaseKey(
    ignoreKey.split('::')[0] || '',
    ignoreKey.split('::')[1] || '',
  );

  if (!normalizedCode) {
    return false;
  }

  return Object.entries(state.issued || {}).some(([key, issued]) => {
    if (key === normalizedIgnoreKey) {
      return false;
    }

    return String((issued && (issued.code || issued.accessCode)) || '').trim().toUpperCase() === normalizedCode;
  });
}

function generateAccessCode(caseCode, email) {
  const casePrefix = chatKey(caseCode).replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CASE';
  const emailPrefix = String(email || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3) || 'USR';

  let candidate = '';
  do {
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    candidate = `KUAC-${casePrefix}-${emailPrefix}-${token}`;
  } while (isAccessCodeTaken(candidate));

  return candidate;
}

function issueAccessCode(payload) {
  const email = String(payload.email || '').trim();
  const caseCode = String(payload.caseCode || '').trim().toUpperCase();
  const agent = String(payload.agent || 'KUAC Associate').trim() || 'KUAC Associate';
  const clientName = String(payload.clientName || 'Client').trim() || 'Client';
  let code = String(payload.code || '').trim();
  const note = String(payload.note || '').trim();
  const dashboardId = String(payload.dashboardId || '').trim();
  const key = normalizeCaseKey(email, caseCode);

  if (!email || !caseCode) {
    const err = new Error('Email and case code are required');
    err.statusCode = 400;
    throw err;
  }

  if (!code || isAccessCodeTaken(code, key)) {
    code = generateAccessCode(caseCode, email);
  }

  state.issued[key] = {
    email,
    caseCode,
    agent,
    clientName,
    code,
    accessCode: code,
    note,
    dashboardId: dashboardId || String(state.submissions[key] && state.submissions[key].dashboardId || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  const ticketDashboardId = state.issued[key].dashboardId;
  if (ticketDashboardId) {
    upsertSupportTicket({
      dashboardId: ticketDashboardId,
      caseCode,
      email,
      agent,
      clientName,
      status: 'issued',
      accessCode: code,
      summary: note || `Access code issued for ${caseCode}`,
    });
  }

  if (state.submissions[key]) {
    state.submissions[key].status = 'issued';
    state.submissions[key].issuedAt = state.issued[key].updatedAt;
    state.submissions[key].agent = agent;
    state.submissions[key].clientName = clientName;
    state.submissions[key].dashboardId = state.submissions[key].dashboardId || state.issued[key].dashboardId;
  }

  return state.issued[key];
}

function getSubmission(email, caseCode) {
  return state.submissions[normalizeCaseKey(email, caseCode)] || null;
}

function getIssued(email, caseCode) {
  return state.issued[normalizeCaseKey(email, caseCode)] || null;
}

async function serveStatic(req, res, pathname) {
  let requestPath = decodeURIComponent(pathname);
  if (requestPath.includes('\0')) {
    res.writeHead(400);
    res.end('Invalid request');
    return;
  }

  if (requestPath === '/') {
    requestPath = '/index.html';
  }

  let filePath = path.join(ROOT, requestPath);
  let stat;

  try {
    stat = await fsp.stat(filePath);
  } catch (error) {
    if (!path.extname(filePath)) {
      const indexPath = path.join(filePath, 'index.html');
      try {
        stat = await fsp.stat(indexPath);
        filePath = indexPath;
      } catch (innerError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
  }

  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  }[ext] || 'application/octet-stream';

  try {
    const buffer = await fsp.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
    });
    res.end(buffer);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unable to serve file');
  }
}

function handleApi(req, res, urlObj) {
  if (req.method === 'GET' && urlObj.pathname === '/api/admin/session') {
    sendJson(res, 200, {
      ok: true,
      authenticated: isDashboardAuthorized(req),
      expiresAt: loadSession(getSessionId(req))?.expiresAt || null,
    });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/admin/login') {
    readJsonBody(req)
      .then(async (payload) => {
        const code = String(payload.code || '').trim();
        if (!DASHBOARD_ACCESS_CODE || code !== DASHBOARD_ACCESS_CODE) {
          sendJson(res, 401, { ok: false, error: 'Access code is invalid' });
          return;
        }

        const session = createDashboardSession();
        await saveState();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': setCookieHeader(DASHBOARD_SESSION_COOKIE, session.sessionId, DASHBOARD_SESSION_TTL_MS / 1000),
        });
        res.end(JSON.stringify({ ok: true, authenticated: true, expiresAt: session.expiresAt }));
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/admin/logout') {
    const sessionId = getSessionId(req);
    if (sessionId && state.sessions[sessionId]) {
      delete state.sessions[sessionId];
      saveState().catch(() => {});
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': setCookieHeader(DASHBOARD_SESSION_COOKIE, '', 0),
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/state') {
    sendJson(res, 200, publicState());
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/submission') {
    const email = urlObj.searchParams.get('email') || '';
    const caseCode = urlObj.searchParams.get('caseCode') || '';
    sendJson(res, 200, {
      submission: getSubmission(email, caseCode),
      issued: getIssued(email, caseCode),
    });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/dashboard') {
    const dashboardId = urlObj.searchParams.get('dashboardId') || '';
    const record = findCaseRecordByDashboardId(dashboardId);

    if (!dashboardId.trim()) {
      sendJson(res, 400, { ok: false, error: 'Dashboard ID is required' });
      return;
    }

    if (!record) {
      sendJson(res, 404, { ok: false, error: 'Dashboard record not found' });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      dashboardId: record.dashboardId,
      caseCode: record.caseCode,
      submission: record.submission,
      issued: record.issued,
      messages: record.messages,
    });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/support/ticket') {
    const dashboardId = urlObj.searchParams.get('dashboardId') || '';
    const caseCode = urlObj.searchParams.get('caseCode') || '';
    const email = urlObj.searchParams.get('email') || '';
    const accessCode = urlObj.searchParams.get('accessCode') || '';
    const record =
      findSupportTicketByDashboardId(dashboardId) ||
      findSupportTicketByCaseCode(caseCode) ||
      findSupportTicketByEmailAndCase(email, caseCode) ||
      (dashboardId.trim() ? findCaseRecordByDashboardId(dashboardId) : null);

    if (!dashboardId.trim() && !caseCode.trim() && !email.trim()) {
      sendJson(res, 400, { ok: false, error: 'Provide a dashboard ID, case code, or email' });
      return;
    }

    const submission = record || (email.trim() && caseCode.trim() ? getSubmission(email, caseCode) : null);
    const issued = record || (email.trim() && caseCode.trim() ? getIssued(email, caseCode) : null);
    const issuedAccessCode = String((issued && (issued.accessCode || issued.code)) || '').trim();

    if (accessCode.trim() && issuedAccessCode && accessCode.trim() !== issuedAccessCode) {
      sendJson(res, 401, { ok: false, error: 'Access code is invalid' });
      return;
    }

    if (!record && !submission && !issued) {
      sendJson(res, 404, { ok: false, error: 'Support ticket not found' });
      return;
    }

    const resolvedDashboardId = (record && record.dashboardId) || (submission && submission.dashboardId) || (issued && issued.dashboardId) || normalizeDashboardId(dashboardId);
    const resolvedCaseCode = chatKey((record && record.caseCode) || (submission && submission.caseCode) || (issued && issued.caseCode) || caseCode);
    const resolvedSubmission = submission || (record && record.submission) || record || null;
    const resolvedIssued = issued || (record && record.issued) || null;

    sendJson(res, 200, {
      ok: true,
      ticket: (record && (record.ticket || record)) || resolvedSubmission || resolvedIssued || null,
      submission: resolvedSubmission,
      issued: resolvedIssued,
      messages: resolvedCaseCode ? getChatThread(resolvedCaseCode) : [],
      dashboardId: resolvedDashboardId,
      caseCode: resolvedCaseCode,
    });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/submissions') {
    readJsonBody(req)
      .then(async (payload) => {
        const submission = upsertSubmission(payload);
        await saveState();
        sendJson(res, 200, { ok: true, submission, state: publicState() });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/support/ticket') {
    readJsonBody(req)
      .then(async (payload) => {
        const submission = upsertSubmission(payload);
        await saveState();
        const issued = getIssued(submission.email, submission.caseCode);
        const ticket = findSupportTicketByDashboardId(submission.dashboardId) || findSupportTicketByCaseCode(submission.caseCode);
        sendJson(res, 200, {
          ok: true,
          ticket: ticket || submission,
          submission,
          issued,
          messages: submission.caseCode ? getChatThread(submission.caseCode) : [],
          state: publicState(),
        });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/agent/issue') {
    readJsonBody(req)
      .then(async (payload) => {
        const issued = issueAccessCode(payload);
        await saveState();
        sendJson(res, 200, { ok: true, issued, state: publicState() });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if ((req.method === 'PATCH' || req.method === 'POST') && urlObj.pathname === '/api/support/ticket/status') {
    readJsonBody(req)
      .then(async (payload) => {
        const ticket = updateSupportTicketStatus(payload);
        await saveState();
        const issued = ticket.email && ticket.caseCode ? getIssued(ticket.email, ticket.caseCode) : null;
        sendJson(res, 200, {
          ok: true,
          ticket,
          submission: ticket.email && ticket.caseCode ? getSubmission(ticket.email, ticket.caseCode) || ticket : ticket,
          issued,
          messages: ticket.caseCode ? getChatThread(ticket.caseCode) : [],
          state: publicState(),
        });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/support/ticket/messages') {
    readJsonBody(req)
      .then(async (payload) => {
        const message = appendSupportTicketMessage(payload);
        await saveState();
        sendJson(res, 200, { ok: true, message, messages: getChatThread(message.caseCode) });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/chat/messages') {
    const caseCode = urlObj.searchParams.get('caseCode') || '';
    const dashboardId = urlObj.searchParams.get('dashboardId') || '';
    const record = dashboardId.trim() ? findCaseRecordByDashboardId(dashboardId) : null;
    const resolvedCaseCode = String(caseCode || (record && record.caseCode) || '').trim().toUpperCase();

    if (!resolvedCaseCode) {
      sendJson(res, 400, { ok: false, error: 'Provide a case code or dashboard ID' });
      return;
    }

    if (!hasKnownCase(resolvedCaseCode)) {
      sendJson(res, 404, { ok: false, error: 'Case code not found' });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      caseCode: resolvedCaseCode,
      dashboardId: record && record.dashboardId ? record.dashboardId : normalizeDashboardId(dashboardId),
      messages: getChatThread(resolvedCaseCode),
    });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/chat/messages') {
    readJsonBody(req)
      .then(async (payload) => {
        const message = appendChatMessage(payload);
        await saveState();
        sendJson(res, 200, { ok: true, message, messages: getChatThread(message.caseCode) });
      })
      .catch((error) => {
        sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Server error' });
      });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
}

async function handleRequest(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (urlObj.pathname.startsWith('/api/') && req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  const adminProtectedRoute =
    urlObj.pathname === '/api/state' ||
    urlObj.pathname === '/api/agent/issue' ||
    urlObj.pathname === '/agent-dashboard.html';

  if (urlObj.pathname === '/agent-login.html' && isDashboardAuthorized(req)) {
    res.writeHead(302, {
      Location: '/agent-dashboard.html',
      'Cache-Control': 'no-store',
    });
    res.end();
    return;
  }

  if (adminProtectedRoute && !isDashboardAuthorized(req)) {
    if (urlObj.pathname === '/agent-dashboard.html') {
      res.writeHead(302, {
        Location: '/agent-login.html',
        'Cache-Control': 'no-store',
      });
      res.end();
      return;
    }

    sendJson(res, 401, { ok: false, error: 'Staff authentication required' });
    return;
  }

  if (urlObj.pathname.startsWith('/api/')) {
    handleApi(req, res, urlObj);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  await serveStatic(req, res, urlObj.pathname);
}

async function main() {
  await ensureStateLoaded();
  await fsp.mkdir(DATA_DIR, { recursive: true });

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error && error.message ? error.message : 'Unexpected server error');
    });
  });

  server.listen(PORT, () => {
    console.log(`KUAC server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
