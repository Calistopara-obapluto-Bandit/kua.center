const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'index.html',
  'agent-login.html',
  'agent-dashboard.html',
  'support-chat.html',
  'config.js',
  'server.js',
  'render.yaml',
];

const HTML_FILES = [
  'index.html',
  'agent-login.html',
  'agent-dashboard.html',
  'support-chat.html',
];

const CSS_FILES = [
  'css/styles.css',
  'css/bootstrap.min.css',
  'css/tooplate-infinite-loop.css',
  'magnific-popup/magnific-popup.css',
  'slick/slick.css',
  'slick/slick-theme.css',
];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

function normalizeReference(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return null;
  }

  return trimmed.split(/[?#]/)[0];
}

function checkRelativeReferences(relativePath, text, patterns) {
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const reference = normalizeReference(match[1]);
      if (!reference) {
        continue;
      }

      const resolved = path.normalize(
        path.join(
          ROOT,
          reference.startsWith('/') ? reference.slice(1) : path.join(path.dirname(relativePath), reference),
        ),
      );
      if (!resolved.startsWith(ROOT)) {
        throw new Error(`Out-of-repo reference in ${relativePath}: ${reference}`);
      }

      if (!fs.existsSync(resolved)) {
        throw new Error(`Broken reference in ${relativePath}: ${reference}`);
      }
    }
  }
}

function main() {
  for (const file of REQUIRED_FILES) {
    assertExists(file);
  }

  for (const file of HTML_FILES) {
    const text = readText(file);
    checkRelativeReferences(file, text, [
      /(?:src|href)=["']([^"']+)["']/gi,
      /url\(["']?([^"')]+)["']?\)/gi,
    ]);
  }

  for (const file of CSS_FILES) {
    const text = readText(file);
    checkRelativeReferences(file, text, [
      /url\(["']?([^"')]+)["']?\)/gi,
    ]);
  }

  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, ['--check', 'server.js'], { stdio: 'inherit', cwd: ROOT });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  console.log('Static and server validation passed.');
}

main();
