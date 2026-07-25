const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('displays the package version in the app footer', () => {
  const root = path.resolve(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const indexHtml = fs.readFileSync(path.join(root, 'site', 'index.html'), 'utf8');

  assert.match(indexHtml, /data-package-version/);
  assert.match(indexHtml, new RegExp('Version ' + packageJson.version.replaceAll('.', '\\.')));
  assert.match(indexHtml, new RegExp('v' + packageJson.version.replaceAll('.', '\\.')));
});
