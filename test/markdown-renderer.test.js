const assert = require('node:assert/strict');
const test = require('node:test');
const markdownIt = require('markdown-it');

global.window = global;
require('../site/markdown-renderer.js');

const markdown = global.createMarkdownRenderer(
  markdownIt,
  (code, language) => '<mark data-language="' + language + '">' + code + '</mark>',
  () => 'plain'
);

test('renders mature Markdown features', () => {
  const output = markdown.render([
    '| Feature | Works |',
    '| --- | --- |',
    '| Tables | Yes |',
    '',
    '- parent',
    '  - child',
    '',
    '[reference][demo]',
    '',
    '[demo]: https://example.com',
  ].join('\n'));

  assert.match(output, /<table>/);
  assert.match(output, /<ul>[\s\S]*<ul>/);
  assert.match(output, /href="https:\/\/example\.com"/);
  assert.match(output, /target="_blank"/);
  assert.match(output, /rel="noopener noreferrer"/);
  assert.match(output, /referrerpolicy="no-referrer"/);
});

test('keeps pasted HTML inert and rejects active URL schemes', () => {
  const output = markdown.render([
    '<img src=x onerror="alert(1)">',
    '',
    '[unsafe](javascript:alert(1))',
  ].join('\n'));

  assert.doesNotMatch(output, /<img\b/);
  assert.match(output, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(output, /href=/);
});

test('blocks Markdown images that could make a network request', () => {
  const output = markdown.render([
    '![remote](https://example.com/tracker.png)',
    '![relative](/tracker.png)',
  ].join('\n'));

  assert.doesNotMatch(output, /<img\b/);
  assert.doesNotMatch(output, /https:\/\/example\.com/);
  assert.doesNotMatch(output, /src=/);
  assert.match(output, /Remote image blocked: remote/);
  assert.match(output, /Remote image blocked: relative/);
});

test('allows an embedded raster image without a fetch', () => {
  const output = markdown.render('![embedded](data:image/png;base64,iVBORw0KGgo=)');

  assert.match(output, /<img\b/);
  assert.match(output, /src="data:image\/png;base64,iVBORw0KGgo="/);
});

test('uses the existing local syntax highlighter for fenced code', () => {
  const output = markdown.render('```js\nconst answer = 42;\n```');

  assert.match(output, /data-language="javascript"/);
});
