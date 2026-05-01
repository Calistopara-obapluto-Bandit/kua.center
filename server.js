const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const Busboy = require('busboy');
const nodemailer = require('nodemailer');

const PORT = parseInt(process.env.PORT || '10000', 10);
const ROOT = __dirname;
const CALLBACK_TO_EMAIL = process.env.CALLBACK_TO_EMAIL || 'kua.center@gmail.com';
const CALLBACK_FROM_NAME = process.env.CALLBACK_FROM_NAME || 'Krains UniAid Center';
const CALLBACK_FROM_EMAIL = process.env.CALLBACK_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@kua.center';
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_PORT = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT, 10)
  : SMTP_SECURE
    ? 465
    : 587;
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS;
const SMTP_CONNECTION_TIMEOUT = parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000', 10);
const SMTP_GREETING_TIMEOUT = parseInt(process.env.SMTP_GREETING_TIMEOUT || '10000', 10);
const SMTP_SOCKET_TIMEOUT = parseInt(process.env.SMTP_SOCKET_TIMEOUT || '15000', 10);
const MAX_ATTACHMENT_BYTES = parseInt(process.env.MAX_ATTACHMENT_BYTES || String(10 * 1024 * 1024), 10);
const FORMSUBMIT_EMAIL = process.env.CALLBACK_TO_EMAIL || 'kua.center@gmail.com';
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(FORMSUBMIT_EMAIL)}`;

const mailTransport = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT,
      greetingTimeout: SMTP_GREETING_TIMEOUT,
      socketTimeout: SMTP_SOCKET_TIMEOUT,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function wantsHtmlResponse(req) {
  const accept = (req.headers.accept || '').toLowerCase();
  return accept.includes('text/html') && !accept.includes('application/json');
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
}

function getSafePath(urlPath) {
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path
    .normalize(decodeURIComponent(requested))
    .replace(/^(\.\.[/\\])+/, '');
  const resolved = path.join(ROOT, normalized);
  return resolved.startsWith(ROOT) ? resolved : null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function readUrlEncodedBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      const params = new URLSearchParams(raw);
      const body = {};
      for (const [key, value] of params.entries()) {
        body[key] = value;
      }
      resolve(body);
    });
    req.on('error', reject);
  });
}

function readMultipartBody(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let attachment = null;
    let settled = false;

    const doneResolve = () => {
      if (!settled) {
        settled = true;
        resolve({ fields, attachment });
      }
    };

    const doneReject = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: MAX_ATTACHMENT_BYTES,
        files: 1,
        fields: 20,
      },
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, file, info) => {
      if (name !== 'attachment') {
        file.resume();
        return;
      }

      const chunks = [];
      let tooLarge = false;

      file.on('limit', () => {
        tooLarge = true;
      });

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        if (tooLarge) {
          doneReject(new Error(`Attachment exceeds the ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB limit`));
          return;
        }

        if (info && info.filename) {
          attachment = {
            filename: info.filename,
            content: Buffer.concat(chunks),
            contentType: info.mimeType || 'application/octet-stream',
          };
        }
      });
    });

    busboy.on('error', doneReject);
    busboy.on('finish', doneResolve);
    req.pipe(busboy);
  });
}

async function readSubmission(req) {
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('multipart/form-data')) {
    return readMultipartBody(req);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return {
      fields: await readUrlEncodedBody(req),
      attachment: null,
    };
  }

  if (contentType.includes('application/json')) {
    return {
      fields: await readJsonBody(req),
      attachment: null,
    };
  }

  return {
    fields: await readUrlEncodedBody(req),
    attachment: null,
  };
}

function normalizeField(value) {
  return String(value || '').trim();
}

async function sendCallbackEmail(submission) {
  const lines = [
    'New Krains UniAid Center callback request',
    '',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone}`,
    `Message: ${submission.message || '(none)'}`,
    `Received at: ${submission.receivedAt}`,
    `IP: ${submission.ip || '(unknown)'}`,
    `User Agent: ${submission.userAgent || '(unknown)'}`,
  ];

  const attachments = submission.attachment
    ? [{
        filename: submission.attachment.filename,
        content: submission.attachment.content,
        contentType: submission.attachment.contentType,
      }]
    : [];

  if (!mailTransport) {
    return sendViaFormSubmit(submission);
  }

  try {
    await mailTransport.sendMail({
      from: `"${CALLBACK_FROM_NAME}" <${CALLBACK_FROM_EMAIL}>`,
      to: CALLBACK_TO_EMAIL,
      replyTo: submission.email,
      subject: `${CALLBACK_FROM_NAME} | Callback Request: ${submission.name}`,
      text: lines.join('\n'),
      attachments,
    });
  } catch (smtpError) {
    if (attachments.length > 0) {
      throw new Error(`SMTP delivery failed for attachment request: ${smtpError.message || 'Unknown error'}`);
    }

    return sendViaFormSubmit(submission, smtpError);
  }

  return {
    message: 'Callback request sent successfully',
  };
}

function sendViaFormSubmit(submission, previousError = null) {
  const payload = new URLSearchParams({
    name: submission.name,
    email: submission.email,
    phone: submission.phone,
    message: submission.message || '',
    _subject: `${CALLBACK_FROM_NAME} | Callback Request: ${submission.name}`,
    _template: 'table',
    _captcha: 'false',
    _honey: '',
  }).toString();

  return new Promise((resolve, reject) => {
    const request = https.request(FORMSUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 10000,
    }, (response) => {
      let raw = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        let result = {};

        if (raw) {
          try {
            result = JSON.parse(raw);
          } catch (parseError) {
            result = { message: raw };
          }
        }

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300 && result.success !== 'false') {
          resolve({
            message: result.message || 'Callback request sent successfully',
          });
          return;
        }

        const activationMessage = typeof result.message === 'string' && /activation/i.test(result.message)
          ? 'Callback request received. Check the inbox for the FormSubmit activation email and confirm it once, then future submissions will arrive there.'
          : null;

        if (activationMessage) {
          resolve({ message: activationMessage });
          return;
        }

        const fallbackReason = previousError ? ` SMTP fallback triggered after: ${previousError.message || previousError}` : '';
        reject(new Error(`FormSubmit delivery failed.${fallbackReason}${raw ? ` Response: ${raw}` : ''}`));
      });
    });

    request.on('error', (error) => {
      const fallbackReason = previousError ? ` SMTP fallback triggered after: ${previousError.message || previousError}` : '';
      reject(new Error(`FormSubmit request failed.${fallbackReason} ${error.message || 'Unknown error'}`));
    });

    request.write(payload);
    request.end();
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/callback') {
    try {
      const { fields, attachment } = await readSubmission(req);
      const name = normalizeField(fields.name);
      const email = normalizeField(fields.email);
      const phone = normalizeField(fields.phone);
      const message = normalizeField(fields.message);
      const honeypot = normalizeField(fields._honey);

      if (honeypot) {
        send(res, 200, {
          ok: true,
          message: 'Callback request sent successfully',
        });
        return;
      }

      if (!name || !email || !phone) {
        send(res, 400, {
          ok: false,
          error: 'name, email, and phone are required',
        });
        return;
      }

      const submission = {
        name,
        email,
        phone,
        message,
        attachment,
        receivedAt: new Date().toISOString(),
        ip: req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
      };

      const result = await sendCallbackEmail(submission);

      if (wantsHtmlResponse(req)) {
        res.writeHead(303, {
          Location: '/#contact',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        });
        res.end();
        return;
      }

      send(res, 200, {
        ok: true,
        message: result.message || 'Callback request sent successfully',
      });
    } catch (error) {
      send(res, 503, {
        ok: false,
        error: error.message || 'Unable to process callback request',
      });
    }
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    send(res, 200, { ok: true, status: 'healthy' });
    return;
  }

  const safePath = getSafePath(requestUrl.pathname);
  if (!safePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, safePath);
      return;
    }

    if (!path.extname(safePath)) {
      serveFile(res, path.join(ROOT, 'index.html'));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
});

server.listen(PORT, () => {
  console.log(`KUAC site listening on port ${PORT}`);
  console.log(`Callback emails will be sent to ${CALLBACK_TO_EMAIL}`);
  console.log(`Sender name will appear as ${CALLBACK_FROM_NAME}`);
});
