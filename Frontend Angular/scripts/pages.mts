// Publishes the demo build to the repo-root docs/ (GitHub Pages: main branch, /docs, base /Projeto-RR-Nexus/).
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/projeto-rr-nexus/browser/', import.meta.url);
const docs = new URL('../../docs/', import.meta.url);
/** Browser-only routes: each gets a noindex copy of the shell so a reload answers 200, not 404. */
const APP_ROUTES = ['meu-perfil'];

// ponytail: async cp on purpose: Node 22's cpSync exits 127 silently on the non-ASCII path ("Programação").
await rm(docs, { recursive: true, force: true });
await cp(dist, docs, { recursive: true });
await writeFile(new URL('.nojekyll', docs), '');

// Fonts are referenced from the CSS with hashed names: preload them so text does not wait for the app to render.
const fonts = (await readdir(new URL('media/', docs))).filter((f) => f.endsWith('.woff'));
const preload = fonts.map((f) => `<link rel="preload" as="font" type="font/woff" href="media/${f}" crossorigin>`).join('');
const withPreload = async (file: string) => (await readFile(new URL(file, docs), 'utf8')).replace('</head>', `${preload}</head>`);
// index.html is the prerendered home page; index.csr.html is the empty client shell.
await writeFile(new URL('index.html', docs), await withPreload('index.html'));

// Shells for app routes and unknown URLs (the router redirects those to the home page).
const shell = (await withPreload('index.csr.html'))
  .replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">')
  .replace(/<link rel="canonical"[^>]*>/, '');
await rm(new URL('index.csr.html', docs));
await writeFile(new URL('404.html', docs), shell);
for (const route of APP_ROUTES) {
  await mkdir(new URL(`${route}/`, docs), { recursive: true });
  await writeFile(new URL(`${route}/index.html`, docs), shell);
}
console.log(`pages: dist -> docs/ (+ .nojekyll, 404.html, ${fonts.length} font preloads, shells: ${APP_ROUTES.join(', ')})`);
