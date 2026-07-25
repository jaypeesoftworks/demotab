(function (global) {
  'use strict';

  function createMemoryHistory(limit = 50) {
    let entries = [];
    let index = -1;

    return {
      push(entry) {
        entries = entries.slice(0, index + 1);
        entries.push(entry);
        if (entries.length > limit) entries.shift();
        index = entries.length - 1;
      },

      back(includeCurrent = false) {
        if (includeCurrent && index >= 0) return entries[index];
        if (index <= 0) return null;
        index -= 1;
        return entries[index];
      },

      forward() {
        if (index >= entries.length - 1) return null;
        index += 1;
        return entries[index];
      },

      get canBack() {
        return index > 0;
      },

      get canForward() {
        return index >= 0 && index < entries.length - 1;
      },

      get hasCurrent() {
        return index >= 0;
      },
    };
  }

  global.DemoTabHistory = { createMemoryHistory };
}(window));
