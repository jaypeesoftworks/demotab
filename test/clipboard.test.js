const assert = require('node:assert/strict');
const test = require('node:test');

global.window = global;
require('../site/clipboard.js');

test('reads text from a desktop paste event', () => {
  const payload = global.DemoTabClipboard.fromClipboardEvent({
    clipboardData: {
      items: [],
      getData(type) {
        return type === 'text/plain' ? 'hello mobile' : '';
      },
    },
  });

  assert.deepEqual(payload, { type: 'text', value: 'hello mobile' });
});

test('allows a mobile paste event with missing clipboardData to fall through', () => {
  assert.equal(global.DemoTabClipboard.fromClipboardEvent({ clipboardData: null }), null);
});

test('reads text from the async clipboard API', async () => {
  const payload = await global.DemoTabClipboard.fromClipboardApi({
    readText: async () => 'allowed paste',
  });

  assert.deepEqual(payload, { type: 'text', value: 'allowed paste' });
});

test('falls back cleanly when clipboard permission is denied', async () => {
  const payload = await global.DemoTabClipboard.fromClipboardApi({
    readText: async () => {
      throw new Error('NotAllowedError');
    },
  });

  assert.equal(payload, null);
});
