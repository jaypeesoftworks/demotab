# Contributing to DemoTab

Thanks for your interest. DemoTab is intentionally minimal: it is statically deployed and never loads runtime dependencies from the network. Tailwind CSS is compiled locally and the generated stylesheet is committed with the site.

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser. The development command compiles Tailwind locally before starting the privacy-restricted server.

## Linting

```bash
npm run lint
```

ESLint is configured in `eslint.config.js`. Fix any errors before submitting a PR; warnings are advisory.

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your changes inside `site/` (or repo-root files like `_headers`, `README.md`).
3. Test manually in at least Chrome and Firefox — paste text, markdown, code, and an image.
4. Verify that no new outgoing network requests are introduced. The CSP (`connect-src 'none'`) must remain intact and unweakened.
5. Open a PR with a clear description of what changed and why.

## Design constraints

- **No external dependencies at runtime.** No CDN fonts, no analytics, no third-party scripts.
- **Static deployment.** Run `npm run build` and commit the generated `site/app.css`; Cloudflare deploys `site/` as-is.
- **CSP must not be weakened.** `connect-src 'none'` is the core privacy guarantee.
- **Keep browser code focused.** Shared local-only behavior may be split into small scripts under `site/`.

## Reporting bugs

Open a GitHub issue. Include browser/OS version and steps to reproduce.
