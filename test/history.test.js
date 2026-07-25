const assert = require('node:assert/strict');
const test = require('node:test');

global.window = global;
require('../site/history.js');

test('keeps history in memory and navigates backward and forward', () => {
  const history = global.DemoTabHistory.createMemoryHistory();
  history.push({ value: 'one' });
  history.push({ value: 'two' });

  assert.equal(history.back().value, 'one');
  assert.equal(history.forward().value, 'two');
});

test('truncates the forward branch when new content is pasted', () => {
  const history = global.DemoTabHistory.createMemoryHistory();
  history.push({ value: 'one' });
  history.push({ value: 'two' });
  history.back();
  history.push({ value: 'replacement' });

  assert.equal(history.canForward, false);
  assert.equal(history.back().value, 'one');
});

test('can restore the current entry after the display is cleared', () => {
  const history = global.DemoTabHistory.createMemoryHistory();
  history.push({ value: 'only item' });

  assert.equal(history.back(true).value, 'only item');
  assert.equal(history.canBack, false);
});

test('bounds retained entries', () => {
  const history = global.DemoTabHistory.createMemoryHistory(2);
  history.push({ value: 'one' });
  history.push({ value: 'two' });
  history.push({ value: 'three' });

  assert.equal(history.back().value, 'two');
  assert.equal(history.back(), null);
});
