(function (global) {
  'use strict';

  function fromClipboardEvent(event) {
    const data = event && event.clipboardData;
    if (!data) return null;

    const items = data.items ? Array.from(data.items) : [];
    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) return { type: 'image', value: blob };
      }
    }

    const text = data.getData('text/plain') || data.getData('text/html') || '';
    return text.trim() ? { type: 'text', value: text } : null;
  }

  async function fromClipboardApi(clipboard) {
    if (!clipboard) return null;

    if (typeof clipboard.readText === 'function') {
      try {
        const text = await clipboard.readText();
        if (text && text.trim()) return { type: 'text', value: text };
      } catch {
        // Some mobile browsers expose readText but only support read().
      }
    }

    if (typeof clipboard.read === 'function') {
      try {
        const items = await clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            return { type: 'image', value: await item.getType(imageType) };
          }
          if (item.types.includes('text/plain')) {
            const text = await (await item.getType('text/plain')).text();
            if (text.trim()) return { type: 'text', value: text };
          }
        }
      } catch {
        // The editable fallback handles denied or unsupported clipboard access.
      }
    }

    return null;
  }

  global.DemoTabClipboard = {
    fromClipboardApi,
    fromClipboardEvent,
  };
}(window));
