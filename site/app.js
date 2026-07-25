// ============================================================
// DemoTab — app.js
// All dependencies are vendored locally. Zero runtime network requests.
// Everything runs locally in your browser tab.
// ============================================================

'use strict';

// ── State ────────────────────────────────────────────────────

const state = {
  mode:       'auto',   // auto | text | markdown | html | code | image
  codeLang:   'auto',
  hasContent: false,
  codeTheme:  'dark',   // dark | light
  wrapLines:  false,
  fontSize:   16,       // content font size in px (code = fontSize - 2)
};

const memoryHistory = window.DemoTabHistory.createMemoryHistory(50);

const FONT_MIN = 10;
const FONT_MAX = 32;
const FONT_STEP = 2;

// ── DOM refs (populated in init) ─────────────────────────────

let $dropZone, $dropRing, $dropIcon, $contentArea, $clearBtn;
let $themeBtn, $pasteBtn, $pasteCapture, $pasteStatus;
let $historyBack, $historyForward;
let activeImageUrl = null;

// ── Syntax Highlighter ───────────────────────────────────────

const KEYWORDS = {
  javascript: new Set(['break','case','catch','class','const','continue','debugger',
    'default','delete','do','else','export','extends','false','finally','for','function',
    'if','import','in','instanceof','let','new','null','return','static','super',
    'switch','this','throw','true','try','typeof','undefined','var','void','while','with',
    'yield','async','await','of','from','as','Promise','console']),
  typescript: new Set(['break','case','catch','class','const','continue','debugger',
    'default','delete','do','else','export','extends','false','finally','for','function',
    'if','implements','import','in','instanceof','interface','let','namespace','new',
    'null','private','protected','public','readonly','return','static','super','switch',
    'this','throw','true','try','type','typeof','undefined','var','void','while','with',
    'yield','async','await','enum','abstract','declare','keyof','infer','never','any',
    'string','number','boolean','object','symbol','unknown']),
  python: new Set(['False','None','True','and','as','assert','async','await','break',
    'class','continue','def','del','elif','else','except','finally','for','from',
    'global','if','import','in','is','lambda','nonlocal','not','or','pass','raise',
    'return','try','while','with','yield','print','range','len','type','int','str',
    'list','dict','set','tuple','bool','float','self','cls']),
  go: new Set(['break','case','chan','const','continue','default','defer','else',
    'fallthrough','for','func','go','goto','if','import','interface','map','package',
    'range','return','select','struct','switch','type','var','nil','true','false',
    'make','len','cap','new','append','copy','delete','close','fmt','error','string',
    'int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64',
    'float32','float64','bool','byte','rune']),
  rust: new Set(['as','break','const','continue','crate','dyn','else','enum','extern',
    'false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub',
    'ref','return','self','Self','static','struct','super','trait','true','type',
    'unsafe','use','where','while','async','await','String','Vec','Option','Result',
    'Some','None','Ok','Err','println','print','i8','i16','i32','i64','i128','u8',
    'u16','u32','u64','u128','f32','f64','bool','char','str','usize','isize']),
  sql: new Set(['SELECT','FROM','WHERE','AND','OR','NOT','IN','LIKE','BETWEEN','IS',
    'NULL','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','ON','AS','GROUP','BY','ORDER',
    'HAVING','LIMIT','OFFSET','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE',
    'TABLE','DROP','ALTER','ADD','COLUMN','INDEX','PRIMARY','KEY','FOREIGN','REFERENCES',
    'UNIQUE','DEFAULT','CONSTRAINT','BEGIN','COMMIT','ROLLBACK','DISTINCT','ALL','EXISTS',
    'UNION','INTERSECT','EXCEPT','CASE','WHEN','THEN','ELSE','END','ASC','DESC',
    'COUNT','SUM','AVG','MAX','MIN','COALESCE','CAST','CONVERT','VARCHAR','INT',
    'INTEGER','BIGINT','FLOAT','DECIMAL','TEXT','BOOLEAN','DATE','TIMESTAMP']),
  css: new Set(['important','inherit','initial','unset','none','auto','normal','bold',
    'italic','solid','dashed','dotted','hidden','visible','scroll','fixed','relative',
    'absolute','sticky','flex','grid','block','inline','center','left','right','top',
    'bottom','middle','baseline','space-between','space-around','wrap','nowrap',
    'contain','cover']),
  bash: new Set(['if','then','else','elif','fi','for','while','do','done','case',
    'esac','in','function','return','local','export','readonly','declare','unset',
    'shift','source','echo','printf','read','test','exit','true','false','cd','ls',
    'pwd','mkdir','rm','cp','mv','cat','grep','sed','awk','sort','head','tail',
    'cut','tr','wc','find','chmod','chown','sudo','apt','pip','npm','git']),
  java: new Set(['abstract','assert','boolean','break','byte','case','catch','char',
    'class','const','continue','default','do','double','else','enum','extends','final',
    'finally','float','for','goto','if','implements','import','instanceof','int',
    'interface','long','native','new','package','private','protected','public','return',
    'short','static','strictfp','super','switch','synchronized','this','throw','throws',
    'transient','try','void','volatile','while','null','true','false','String','System',
    'out','println','print']),
  html: new Set(['DOCTYPE','html','head','body','div','span','p','a','img','ul','ol',
    'li','table','tr','td','th','form','input','button','script','style','link','meta',
    'title','h1','h2','h3','h4','h5','h6','header','footer','nav','main','section',
    'article','aside','pre','code','strong','em','br','hr','iframe','canvas','svg']),
};

const BUILTINS_JS = new Set(['Array','Object','String','Number','Boolean','Function',
  'Symbol','Date','RegExp','Error','Map','Set','WeakMap','WeakSet','Promise','Proxy',
  'Reflect','Math','JSON','parseInt','parseFloat','isNaN','isFinite','encodeURI',
  'decodeURI','setTimeout','setInterval','clearTimeout','clearInterval',
  'document','window','navigator','localStorage','sessionStorage','console']);

const TOKEN_CLASSES = {
  keyword: 'text-[var(--syntax-keyword)]',
  string: 'text-[var(--syntax-string)]',
  comment: 'text-[var(--syntax-comment)] italic',
  number: 'text-[var(--syntax-number)]',
  function: 'text-[var(--syntax-function)]',
  operator: 'text-[var(--syntax-operator)]',
  classname: 'text-[var(--syntax-class)]',
  builtin: 'text-[var(--syntax-builtin)]',
  tag: 'text-[var(--syntax-tag)]',
  attr: 'text-[var(--syntax-attribute)]',
  punct: 'text-[var(--syntax-punctuation)]',
};

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function tokenSpan(type, text) {
  return '<span class="' + TOKEN_CLASSES[type] + '">' + escHtml(text) + '</span>';
}

function tokenizeHTML(code) {
  let out = '', i = 0;
  const c = () => code[i];
  while (i < code.length) {
    if (code.slice(i, i+4) === '<!--') {
      let s = '';
      while (i < code.length && code.slice(i,i+3) !== '-->') { s += c(); i++; }
      s += '-->'; i += 3;
      out += tokenSpan('comment', s);
      continue;
    }
    if (c() === '<') {
      let s = '<'; i++;
      if (c() === '/') { s += '/'; i++; }
      let name = '';
      while (i < code.length && /[a-zA-Z0-9\-:]/.test(c())) { name += c(); i++; }
      s += tokenSpan('tag', name);
      while (i < code.length && c() !== '>' && !(c() === '/' && code[i+1] === '>')) {
        if (/[a-zA-Z_\-]/.test(c())) {
          let attr = '';
          while (i < code.length && /[a-zA-Z0-9\-_:]/.test(c())) { attr += c(); i++; }
          s += tokenSpan('attr', attr);
        } else if (c() === '"' || c() === "'") {
          const q = c(); let val = q; i++;
          while (i < code.length && c() !== q) { val += c(); i++; }
          val += q; i++;
          s += tokenSpan('string', val);
        } else { s += escHtml(c()); i++; }
      }
      if (c() === '/') { s += '/'; i++; }
      if (c() === '>') { s += '>'; i++; }
      out += s; continue;
    }
    out += escHtml(c()); i++;
  }
  return out;
}

function tokenize(code, lang) {
  if (lang === 'html') return tokenizeHTML(code);
  const kw = KEYWORDS[lang] || KEYWORDS.javascript;
  const isJS = ['javascript','typescript'].includes(lang);
  let out = '', i = 0;
  const c = () => code[i];
  const peek = (n=1) => code[i+n];
  const emit = (cls, txt) => cls ? tokenSpan(cls, txt) : escHtml(txt);

  while (i < code.length) {
    if ((c()==='/' && peek()==='/') || (lang==='python' && c()==='#') ||
        (lang==='bash' && c()==='#') || (lang==='sql' && c()==='-' && peek()==='-')) {
      let s = '';
      while (i < code.length && c() !== '\n') { s += c(); i++; }
      out += emit('comment', s); continue;
    }
    if (c()==='/' && peek()==='*') {
      let s = '/*'; i += 2;
      while (i < code.length && !(c()==='*' && peek()==='/')) { s += c(); i++; }
      if (i < code.length) { s += '*/'; i += 2; }
      out += emit('comment', s); continue;
    }
    if (isJS && c()==='`') {
      let s = '`'; i++;
      while (i < code.length && c() !== '`') {
        if (c()==='\\') { s += c(); i++; }
        s += (c() || ''); i++;
      }
      s += '`'; i++;
      out += emit('string', s); continue;
    }
    if (c()==='"' || c()==="'") {
      const q = c(); let s = q; i++;
      while (i < code.length && c() !== q && c() !== '\n') {
        if (c()==='\\') { s += c(); i++; }
        s += (c() || ''); i++;
      }
      s += q; i++;
      out += emit('string', s); continue;
    }
    if (/[0-9]/.test(c()) || (c()==='.' && /[0-9]/.test(peek()))) {
      let s = '';
      while (i < code.length && /[0-9a-fA-FxX._bBoO]/.test(c())) { s += c(); i++; }
      out += emit('number', s); continue;
    }
    if (/[a-zA-Z_$]/.test(c())) {
      let s = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(c())) { s += c(); i++; }
      let j = i; while (j < code.length && code[j] === ' ') j++;
      if (code[j] === '(' && !kw.has(s)) {
        out += emit('function', s);
      } else if (kw.has(s)) {
        out += emit('keyword', s);
      } else if (isJS && BUILTINS_JS.has(s)) {
        out += emit('builtin', s);
      } else if (/^[A-Z]/.test(s)) {
        out += emit('classname', s);
      } else {
        out += escHtml(s);
      }
      continue;
    }
    if (/[+\-*/%=<>!&|^~?:@]/.test(c())) {
      let s = c(); i++;
      if (i < code.length && /[+\-*/%=<>!&|^~?:]/.test(c())) { s += c(); i++; }
      out += emit('operator', s); continue;
    }
    if (/[{}()[\];,.]/.test(c())) { out += emit('punct', c()); i++; continue; }
    out += escHtml(c()); i++;
  }
  return out;
}

function highlight(code, lang) {
  if (!lang || lang === 'auto' || lang === 'plain') return escHtml(code);
  return tokenize(code, lang);
}

// ── Language Detection ────────────────────────────────────────

function detectLang(text) {
  const t = text.slice(0, 2000);
  if (/^#!\/.*?(bash|sh|zsh)\b/.test(t)) return 'bash';
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/im.test(t)) return 'sql';
  if (/\bpackage\s+main\b|\bfunc\s+\w+\s*\(|\bfmt\./.test(t)) return 'go';
  if (/\bfn\s+\w+|\blet\s+mut\b|\bimpl\b|\buse\s+std/.test(t)) return 'rust';
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|\bprint\s*\(|\bclass\s+\w+.*:/.test(t)) return 'python';
  if (/\bpublic\s+(class|interface|static)\b|\bSystem\.out\./.test(t)) return 'java';
  if (/\binterface\b.*\{|\btype\s+\w+\s*=|\bReadonly\b/.test(t)) return 'typescript';
  if (/^\s*<!DOCTYPE\s+html|^<html[\s>]/im.test(t)) return 'html';
  if (/<[a-zA-Z][\w.-]*(\s|\/?>)/.test(t) && /<\/[a-zA-Z]/.test(t)) return 'html';
  if (/^\s*[\[{]/.test(t) && /"[^"]+"\s*:/.test(t)) return 'json';
  if (/\{[^}]+:[^}]+\}/.test(t) && /;/.test(t)) return 'css';
  if (/\b(const|let|var|function|=>|async|await|require|module\.exports)\b/.test(t)) return 'javascript';
  return 'plain';
}

// ── Markdown Parser ───────────────────────────────────────────

const markdown = window.createMarkdownRenderer(window.markdownit, highlight, detectLang);

function parseMarkdown(md) {
  return markdown.render(md);
}

// ── Content Type Detection ────────────────────────────────────
// HTML is always shown as syntax-highlighted source — never rendered live.

function detectType(text) {
  const t = text.trimStart();

  // HTML detected — routes to code viewer with html highlighting
  if (/^<!DOCTYPE\s+html/i.test(t) || /^<html[\s>]/i.test(t)) return 'code';
  if (/^<[a-zA-Z][\w.-]*(\s[^>]*)?>/.test(t) && /<\/[a-zA-Z][\w.-]*>/.test(t)) return 'code';

  const mdScore = [
    /^#{1,6}\s/m.test(t),
    /\*\*[^*]+\*\*/.test(t),
    /\[.+\]\(.+\)/.test(t),
    /^[-*+]\s/m.test(t),
    /^>\s/m.test(t),
    /^`{3}/m.test(t),
    /^---\s*$/m.test(t),
  ].filter(Boolean).length;
  if (mdScore >= 2) return 'markdown';

  const codeScore = [
    /\bfunction\b|\bconst\b|\blet\b|\bvar\b/.test(t),
    /\bdef\b|\bimport\b/.test(t),
    /\{\s*\n|\}\s*\n|;\s*\n/.test(t),
    /^#!\//.test(t),
    /^\s{2,}/.test(t),
  ].filter(Boolean).length;
  if (codeScore >= 2) return 'code';

  return 'text';
}

// ── Font Size ─────────────────────────────────────────────────

function applyFontSize() {
  const root = document.documentElement;
  root.style.setProperty('--content-font-size', state.fontSize + 'px');
  root.style.setProperty('--code-font-size', Math.max(state.fontSize - 2, 10) + 'px');
}

function changeFontSize(delta) {
  state.fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, state.fontSize + delta));
  applyFontSize();
}

function resetFontSize() {
  state.fontSize = 16;
  applyFontSize();
}

// ── Code Theme ───────────────────────────────────────────────

function applyCodeTheme() {
  document.body.classList.toggle('code-light', state.codeTheme === 'light');
  if ($themeBtn) {
    $themeBtn.textContent = state.codeTheme === 'dark' ? '☀ Light' : '◑ Dark';
    $themeBtn.title = state.codeTheme === 'dark'
      ? 'Switch to light code theme (D)'
      : 'Switch to dark code theme (D)';
  }
  // Update any active toolbar theme buttons
  document.querySelectorAll('.code-theme-btn').forEach(btn => {
    btn.textContent = state.codeTheme === 'dark' ? '☀ Light' : '◑ Dark';
  });
}

function toggleCodeTheme() {
  state.codeTheme = state.codeTheme === 'dark' ? 'light' : 'dark';
  applyCodeTheme();
}

// ── Line Wrap ────────────────────────────────────────────────

function applyWrap() {
  const code = $contentArea.querySelector('pre code');
  if (code) {
    code.classList.toggle('whitespace-pre-wrap', state.wrapLines);
    code.classList.toggle('break-all', state.wrapLines);
    code.classList.toggle('whitespace-pre', !state.wrapLines);
  }
  document.querySelectorAll('.code-wrap-btn').forEach(btn => {
    btn.classList.toggle('bg-white/25', state.wrapLines);
    btn.classList.toggle('text-[var(--code-text)]', state.wrapLines);
  });
}

function toggleWrap() {
  state.wrapLines = !state.wrapLines;
  applyWrap();
}

// ── Renderers ─────────────────────────────────────────────────

function renderText(text) {
  const div = document.createElement('div');
  div.className = 'mx-auto w-full max-w-[860px] flex-1 whitespace-pre-wrap break-words px-4 py-4 font-sans leading-[1.8] text-[#202124] [font-size:var(--content-font-size)] sm:px-[clamp(20px,8vw,120px)] sm:py-7';
  div.textContent = text;
  return div;
}

function insertPlainTextAtSelection(text) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function addTextEditControl(editor, originalText) {
  const control = document.createElement('div');
  control.className = 'pointer-events-none sticky top-0 z-20 flex min-h-12 w-full shrink-0 items-center justify-end bg-gradient-to-b from-white via-white/95 to-transparent px-6 sm:px-8';

  const button = document.createElement('button');
  button.className = 'pointer-events-auto min-w-16 rounded-lg border border-[#dadce0] bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-[#5f6368] shadow-md backdrop-blur transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
  button.textContent = 'Edit';
  button.title = 'Edit this text';

  button.addEventListener('click', () => {
    if (editor.dataset.textEditor === 'true') {
      const editedText = editor.innerText.replace(/\r\n?/g, '\n').trimEnd();
      editor.dataset.textEditor = 'false';
      if (editedText !== originalText) {
        dispatchText(editedText);
      } else {
        dispatchText(originalText, false);
      }
      return;
    }

    editor.textContent = originalText;
    editor.dataset.textEditor = 'true';
    editor.setAttribute('contenteditable', 'plaintext-only');
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.classList.add(
      'whitespace-pre-wrap',
      'rounded-xl',
      'bg-blue-50/30',
      'outline-2',
      'outline-offset-[-2px]',
      'outline-blue-200',
      '[-webkit-user-modify:read-write-plaintext-only]'
    );
    button.textContent = 'Done';
    button.title = 'Finish editing';
    editor.focus();
  });

  editor.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      button.click();
    }
  });

  control.appendChild(button);
  $contentArea.prepend(control);
}

function renderMarkdown(text) {
  const div = document.createElement('div');
  div.className = 'prose prose-slate mx-auto w-full max-w-[860px] flex-1 px-4 py-4 [font-size:var(--content-font-size)] prose-a:text-brand prose-img:rounded-lg prose-pre:border prose-pre:border-[#e8eaed] prose-pre:bg-[#f6f8fa] prose-pre:text-[#202124] prose-code:font-mono prose-table:block prose-table:overflow-x-auto sm:px-[clamp(20px,8vw,120px)] sm:py-7';
  div.innerHTML = parseMarkdown(text);
  div.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  return div;
}

function renderCode(text, lang) {
  lang = (lang && lang !== 'auto') ? lang : detectLang(text);
  state.codeLang = lang;

  const wrap = document.createElement('div');
  wrap.className = 'flex min-h-0 flex-1 flex-col';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'flex shrink-0 items-center gap-2 border-b border-[var(--code-toolbar-border)] bg-[var(--code-toolbar-bg)] px-3.5 py-1.5';

  // Language selector (replaces static badge)
  const langSelect = document.createElement('select');
  langSelect.className = 'cursor-pointer rounded border border-[var(--code-toolbar-border)] bg-transparent px-1 py-0.5 font-mono text-[11px] font-medium text-[var(--code-control)] outline-none hover:text-[var(--code-text)] focus:border-brand focus:text-[var(--code-text)]';
  langSelect.title = 'Switch language';
  [['auto','auto'],['javascript','JavaScript'],['typescript','TypeScript'],
   ['python','Python'],['go','Go'],['rust','Rust'],['java','Java'],
   ['sql','SQL'],['css','CSS'],['html','HTML'],['bash','Bash'],['plain','Plain text']
  ].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = label;
    if (val === lang) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener('change', () => {
    state.codeLang = langSelect.value;
    if (state.hasContent && $contentArea.dataset.raw) {
      showContent(renderCode($contentArea.dataset.raw, state.codeLang));
    }
  });

  // Wrap toggle button
  const wrapBtn = document.createElement('button');
  wrapBtn.className = 'code-wrap-btn cursor-pointer rounded border border-[var(--code-toolbar-border)] bg-transparent px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-[var(--code-control)] transition hover:bg-white/15 hover:text-[var(--code-text)]' +
    (state.wrapLines ? ' bg-white/25 text-[var(--code-text)]' : '');
  wrapBtn.textContent = '↵ Wrap';
  wrapBtn.title = 'Toggle line wrap (W)';
  wrapBtn.addEventListener('click', toggleWrap);

  // Theme toggle button
  const themeBtn = document.createElement('button');
  themeBtn.className = 'code-theme-btn cursor-pointer rounded border border-[var(--code-toolbar-border)] bg-transparent px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-[var(--code-control)] transition hover:bg-white/15 hover:text-[var(--code-text)]';
  themeBtn.textContent = state.codeTheme === 'dark' ? '☀ Light' : '◑ Dark';
  themeBtn.title = state.codeTheme === 'dark' ? 'Switch to light theme (D)' : 'Switch to dark theme (D)';
  themeBtn.addEventListener('click', toggleCodeTheme);

  const lines = text.split('\n');
  const lc = document.createElement('span');
  lc.className = 'ml-auto font-mono text-[11px] text-[var(--code-count)]';
  lc.textContent = lines.length + ' line' + (lines.length !== 1 ? 's' : '');

  toolbar.append(langSelect, wrapBtn, themeBtn, lc);

  // Code block
  const pre = document.createElement('pre');
  pre.className = 'm-0 flex-1 overflow-auto bg-[var(--code-bg)] p-0';
  const codeEl = document.createElement('code');
  codeEl.className = 'block py-4 font-mono leading-[1.6] text-[var(--code-text)] [font-size:var(--code-font-size)] [tab-size:2px] ' +
    (state.wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre');
  const highlighted = highlight(text, lang);
  codeEl.innerHTML = highlighted.split('\n').map((ln, idx) =>
    '<span class="flex pr-5 hover:bg-[var(--code-hover)]"><span class="inline-block min-w-10 shrink-0 select-none px-4 text-right text-[13px] text-[var(--code-line-number)]">' +
    (idx+1) + '</span><span class="flex-1">' + ln + '</span></span>'
  ).join('');


  pre.appendChild(codeEl);
  wrap.append(toolbar, pre);
  return wrap;
}

function renderImage(src) {
  const wrap = document.createElement('div');
  wrap.className = 'flex flex-1 items-center justify-center p-6 [background:repeating-conic-gradient(#f0f0f0_0%_25%,transparent_0%_50%)_0_0/20px_20px]';
  const img = document.createElement('img');
  img.className = 'max-h-full max-w-full rounded-lg object-contain shadow-[0_4px_24px_rgba(0,0,0,.18)]';
  img.src = src;
  img.alt = 'Pasted image';
  wrap.appendChild(img);
  return wrap;
}

function releaseActiveImageUrl() {
  if (!activeImageUrl) return;
  URL.revokeObjectURL(activeImageUrl);
  activeImageUrl = null;
}

function updateHistoryControls() {
  if ($historyBack) {
    $historyBack.disabled = !(memoryHistory.canBack ||
      (!state.hasContent && memoryHistory.hasCurrent));
  }
  if ($historyForward) $historyForward.disabled = !memoryHistory.canForward;
}

function dispatchImage(blob, remember = true) {
  if (remember) {
    memoryHistory.push({ type: 'image', value: blob, mode: 'image', codeLang: 'auto' });
  }
  releaseActiveImageUrl();
  activeImageUrl = URL.createObjectURL(blob);
  delete $contentArea.dataset.raw;
  setMode('image', false);
  showContent(renderImage(activeImageUrl));
  updateHistoryControls();
}

function displayHistoryEntry(entry) {
  if (!entry) return;
  state.mode = entry.mode;
  state.codeLang = entry.codeLang;
  setMode(entry.mode, false);
  if (entry.type === 'image') {
    dispatchImage(entry.value, false);
  } else {
    dispatchText(entry.value, false);
  }
  updateHistoryControls();
}

function navigateHistory(direction) {
  const entry = direction < 0
    ? memoryHistory.back(!state.hasContent)
    : memoryHistory.forward();
  displayHistoryEntry(entry);
}

// ── Show / Clear Content ──────────────────────────────────────

function showContent(el) {
  $contentArea.innerHTML = '';
  $contentArea.appendChild(el);
  $contentArea.classList.remove('hidden');
  $contentArea.classList.add('flex', 'flex-col');
  $dropZone.style.display = 'none';
  $clearBtn.classList.remove('hidden');
  state.hasContent = true;
}

function clearContent() {
  releaseActiveImageUrl();
  $contentArea.innerHTML = '';
  delete $contentArea.dataset.raw;
  $contentArea.classList.add('hidden');
  $contentArea.classList.remove('flex', 'flex-col');
  $dropZone.style.display = '';
  $clearBtn.classList.add('hidden');
  state.hasContent = false;
  setMode('auto');
  updateHistoryControls();
}

// ── Paste / Drop ─────────────────────────────────────────────

function dispatchClipboardPayload(payload) {
  if (!payload) return false;
  if (payload.type === 'image') {
    dispatchImage(payload.value);
    return true;
  }
  if (payload.type === 'text' && payload.value.trim()) {
    dispatchText(payload.value);
    return true;
  }
  return false;
}

function handlePaste(e) {
  const activeEditor = e.target?.closest?.('[data-text-editor="true"]');
  if (activeEditor) {
    if (e.clipboardData) {
      const plainText = e.clipboardData.getData('text/plain') ||
        e.clipboardData.getData('text/html') || '';
      e.preventDefault();
      if (plainText) insertPlainTextAtSelection(plainText);
    }
    return;
  }

  const payload = window.DemoTabClipboard.fromClipboardEvent(e);
  if (!payload) {
    // Mobile Safari can omit clipboardData and insert into a focused editable
    // control instead. Do not cancel that browser fallback.
    return;
  }
  e.preventDefault();
  dispatchClipboardPayload(payload);
}

function setDropActive(active) {
  $dropZone.classList.toggle('bg-[#e8f0fe]', active);
  $dropRing.classList.toggle('border-brand', active);
  $dropRing.classList.toggle('border-[#e8eaed]', !active);
  $dropIcon.classList.toggle('text-brand', active);
  $dropIcon.classList.toggle('text-[#e8eaed]', !active);
}

function handleDrop(e) {
  e.preventDefault();
  setDropActive(false);
  const dt = e.dataTransfer;
  if (dt.files && dt.files.length > 0) {
    const file = dt.files[0];
    if (file.type.startsWith('image/')) {
      dispatchImage(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target.result) dispatchText(ev.target.result); };
    reader.readAsText(file);
    return;
  }
  const text = dt.getData('text/plain') || dt.getData('text/html') || '';
  if (text.trim()) dispatchText(text);
}

// ── Dispatch ─────────────────────────────────────────────────

function dispatchText(text, remember = true) {
  releaseActiveImageUrl();
  if (remember) {
    memoryHistory.push({
      type: 'text',
      value: text,
      mode: state.mode,
      codeLang: state.codeLang,
    });
  }
  const effectiveMode = state.mode === 'auto' ? detectType(text) : state.mode;
  const isCode = effectiveMode === 'code';
  if (isCode) {
    const lang = state.codeLang !== 'auto' ? state.codeLang : detectLang(text);
    showContent(renderCode(text, lang));
  } else if (effectiveMode === 'markdown') {
    showContent(renderMarkdown(text));
  } else {
    const editor = renderText(text);
    showContent(editor);
    if (effectiveMode === 'text') addTextEditControl(editor, text);
  }
  $contentArea.dataset.raw = text;
  updateHistoryControls();
}

// ── Mode ─────────────────────────────────────────────────────

function setMode(mode, rerender = true) {
  state.mode = mode;
  document.querySelectorAll('.type-btn').forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('bg-white', active);
    b.classList.toggle('font-semibold', active);
    b.classList.toggle('text-brand', active);
    b.classList.toggle('shadow-sm', active);
    b.classList.toggle('font-medium', !active);
    b.classList.toggle('text-[#5f6368]', !active);
  });
  if (rerender && state.hasContent && $contentArea.dataset.raw) {
    dispatchText($contentArea.dataset.raw, false);
  }
}


// ── Clipboard / Paste Button ──────────────────────────────────

function enablePasteBtn() {
  if ($pasteBtn) $pasteBtn.disabled = false;
}

async function handlePasteBtn() {
  const payload = await window.DemoTabClipboard.fromClipboardApi(navigator.clipboard);
  if (dispatchClipboardPayload(payload)) {
    if ($pasteStatus) $pasteStatus.textContent = '';
    return;
  }

  if ($pasteCapture) {
    $pasteCapture.value = '';
    $pasteCapture.focus({ preventScroll: true });
    if ($pasteStatus) {
      $pasteStatus.textContent = 'Tap and hold in the box, then choose Paste.';
    }
  }
}

// ── Keyboard Shortcuts ────────────────────────────────────────

function handleKeyDown(e) {
  if (e.target instanceof HTMLElement &&
      (e.target.matches('input, textarea, select') || e.target.isContentEditable)) {
    return;
  }

  // Ignore when modifier keys are held (except Shift for + sign)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();

  // Esc — clear
  if (e.key === 'Escape') {
    if (state.hasContent) { clearContent(); e.preventDefault(); }
    return;
  }

  // Mode shortcuts (only when no content or content already showing)
  switch (key) {
    case 't': setMode('text');     e.preventDefault(); return;
    case 'm': setMode('markdown'); e.preventDefault(); return;
    case 'c': setMode('code');     e.preventDefault(); return;
    case 'i': setMode('image');    e.preventDefault(); return;
    case 'a': setMode('auto');     e.preventDefault(); return;
  }

  // Font size
  if (e.key === '+' || e.key === '=' || e.key === '>') {
    changeFontSize(FONT_STEP); e.preventDefault(); return;
  }
  if (e.key === '-' || e.key === '<') {
    changeFontSize(-FONT_STEP); e.preventDefault(); return;
  }
  if (e.key === '0') {
    resetFontSize(); e.preventDefault(); return;
  }

  // Wrap toggle (code mode)
  if (key === 'w') {
    toggleWrap(); e.preventDefault(); return;
  }

  // Theme toggle
  if (key === 'd') {
    toggleCodeTheme(); e.preventDefault(); return;
  }
}

// ── Init ─────────────────────────────────────────────────────

function init() {
  $dropZone     = document.getElementById('drop-zone');
  $dropRing     = document.getElementById('drop-ring');
  $dropIcon     = document.getElementById('drop-icon');
  $contentArea  = document.getElementById('content-area');
  $clearBtn     = document.getElementById('clear-btn');
  $themeBtn     = document.getElementById('btn-theme');
  $pasteBtn     = document.getElementById('btn-paste');
  $pasteCapture = document.getElementById('paste-capture');
  $pasteStatus  = document.getElementById('paste-status');
  $historyBack  = document.getElementById('history-back');
  $historyForward = document.getElementById('history-forward');

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });


  // Font size buttons
  document.getElementById('btn-font-dec')?.addEventListener('click', () => changeFontSize(-FONT_STEP));
  document.getElementById('btn-font-inc')?.addEventListener('click', () => changeFontSize(FONT_STEP));
  $historyBack?.addEventListener('click', () => navigateHistory(-1));
  $historyForward?.addEventListener('click', () => navigateHistory(1));


  if ($clearBtn) $clearBtn.addEventListener('click', clearContent);

  // Paste button — enabled by default (copy/cut events re-enable after use)
  if ($pasteBtn) {
    $pasteBtn.addEventListener('click', handlePasteBtn);
    $pasteBtn.disabled = false;
  }

  if ($pasteCapture) {
    $pasteCapture.addEventListener('input', () => {
      const text = $pasteCapture.value;
      if (!text.trim()) return;
      $pasteCapture.value = '';
      $pasteCapture.blur();
      if ($pasteStatus) $pasteStatus.textContent = '';
      dispatchText(text);
    });
  }

  document.addEventListener('paste', handlePaste);
  document.addEventListener('keydown', handleKeyDown);

  document.body.addEventListener('dragover', e => {
    e.preventDefault();
    setDropActive(true);
  });
  document.body.addEventListener('dragleave', e => {
    if (!e.relatedTarget) setDropActive(false);
  });
  document.body.addEventListener('drop', handleDrop);

  // Re-enable paste button whenever the user copies or cuts something
  document.addEventListener('copy', () => setTimeout(enablePasteBtn, 50));
  document.addEventListener('cut',  () => setTimeout(enablePasteBtn, 50));

  // Apply initial state
  applyFontSize();
  applyCodeTheme();
  updateHistoryControls();
}

document.addEventListener('DOMContentLoaded', init);
