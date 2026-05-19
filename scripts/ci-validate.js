const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'index.html',
  'agent-login.html',
  'agent-dashboard.html',
  'support-chat.html',
  'client-dashboard.html',
  'config.js',
  'render.yaml',
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
    pattern.lastIndex = 0;
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

function walkFiles(dirRelative, allowedExtensions, collected = []) {
  const dirFull = path.join(ROOT, dirRelative);
  for (const entry of fs.readdirSync(dirFull, { withFileTypes: true })) {
    if (entry.name === '.git') {
      continue;
    }

    const nextRelative = path.join(dirRelative, entry.name);
    if (entry.isDirectory()) {
      walkFiles(nextRelative, allowedExtensions, collected);
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      collected.push(nextRelative);
    }
  }

  return collected;
}

function main() {
  for (const file of REQUIRED_FILES) {
    assertExists(file);
  }

  const htmlFiles = walkFiles('.', new Set(['.html']));
  const cssFiles = walkFiles('.', new Set(['.css']));
  const jsFiles = walkFiles('.', new Set(['.js']));

  for (const file of htmlFiles) {
    const text = readText(file);
    checkRelativeReferences(file, text, [
      /(?:src|href)=["']([^"']+)["']/gi,
      /url\(["']?([^"')]+)["']?\)/gi,
    ]);
  }

  for (const file of cssFiles) {
    const text = readText(file);
    checkRelativeReferences(file, text, [
      /url\(["']?([^"')]+)["']?\)/gi,
    ]);
  }

  const { spawnSync } = require('child_process');
  for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', file], { cwd: ROOT, stdio: 'ignore' });
    if (result.status !== 0) {
      throw new Error(`JavaScript syntax check failed for: ${file}`);
    }
  }

  console.log('Static validation passed.');
}

main();
