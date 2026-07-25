'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const indexPath = path.join(root, 'site', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const versionPattern = /(<span data-package-version class="[^"]*" aria-label="Version )[^"]+(">· v)[^<]+(<\/span>)/;

if (!versionPattern.test(indexHtml)) {
  throw new Error('Could not find the package-version footer marker.');
}

const updatedHtml = indexHtml.replace(
  versionPattern,
  '$1' + packageJson.version + '$2' + packageJson.version + '$3'
);

fs.writeFileSync(indexPath, updatedHtml);
