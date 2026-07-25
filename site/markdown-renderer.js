(function (global) {
  'use strict';

  const LANGUAGE_ALIASES = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'plain',
    yaml: 'plain',
    md: 'plain',
    markdown: 'plain',
    xml: 'html',
  };

  const HIGHLIGHT_LANGUAGES = new Set([
    'javascript', 'typescript', 'python', 'go', 'rust', 'java',
    'sql', 'css', 'html', 'bash', 'json', 'plain',
  ]);

  function codeLanguage(info, code, detectLanguage) {
    const requested = (info || '').trim().split(/\s+/, 1)[0].toLowerCase();
    if (!requested) return detectLanguage(code);
    const normalized = LANGUAGE_ALIASES[requested] || requested;
    return HIGHLIGHT_LANGUAGES.has(normalized) ? normalized : 'plain';
  }

  // Markdown images must already contain their bytes. Remote and relative image
  // URLs are deliberately not rendered, so pasted Markdown cannot trigger a fetch.
  function isEmbeddedRasterImage(src) {
    return /^data:image\/(?:gif|png|jpeg|webp|avif);base64,/i.test(src.trim());
  }

  function createMarkdownRenderer(markdownIt, highlightCode, detectLanguage) {
    const renderer = markdownIt({
      html: false,
      linkify: true,
      typographer: false,
      breaks: false,
      highlight(code, info) {
        return highlightCode(code, codeLanguage(info, code, detectLanguage));
      },
    });

    const defaultLinkOpen = renderer.renderer.rules.link_open ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    renderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
      tokens[idx].attrSet('referrerpolicy', 'no-referrer');
      return defaultLinkOpen(tokens, idx, options, env, self);
    };

    const defaultImage = renderer.renderer.rules.image ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    renderer.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const src = token.attrGet('src') || '';
      if (!isEmbeddedRasterImage(src)) {
        const alt = renderer.utils.escapeHtml(token.content || 'image');
        return '<span class="inline-block text-slate-500 italic" role="img" aria-label="' + alt +
          '">[Remote image blocked: ' + alt + ']</span>';
      }
      return defaultImage(tokens, idx, options, env, self);
    };

    return renderer;
  }

  global.createMarkdownRenderer = createMarkdownRenderer;
}(window));
