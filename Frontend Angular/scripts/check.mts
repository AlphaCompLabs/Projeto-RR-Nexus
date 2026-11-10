// Post-build smoke check of docs/ (npm run check, last step of build:pages). Exits 1 on any failure.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const SITE = 'https://alphacomplabs.github.io/Projeto-RR-Nexus/';
const PERSON = { '@type': 'Person', '@id': 'https://g2portfolio.grovicdata.com/#person', name: 'Gustavo Martins Gripaldi', url: 'https://g2portfolio.grovicdata.com/' };
const repo = new URL('../../', import.meta.url);
const docs = new URL('docs/', repo);
const read = (p: string) => readFileSync(new URL(p, docs), 'utf8');
const fails: string[] = [];
const must = (ok: unknown, msg: string) => ok || fails.push(msg);

// Home page SEO
const home = read('index.html');
const title = home.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
const desc = home.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
must(title && title.length <= 160, `title missing or > 160 chars`);
must(desc.length >= 70 && desc.length <= 160, `description has ${desc.length} chars (want 70-160)`);
must(home.includes(`<link rel="canonical" href="${SITE}">`), 'canonical missing');
must(home.includes('<base href="/Projeto-RR-Nexus/">'), 'base href is not /Projeto-RR-Nexus/');
must(home.includes('<meta name="robots" content="index, follow">'), 'home should be indexable');
must(home.includes(`content="${SITE}og.png"`) && existsSync(new URL('og.png', docs)), 'og:image missing');
// Prerendered: content, team credit and the demo note are in the HTML, before any JavaScript.
must((home.match(/<h1[\s>]/g) ?? []).length === 1, 'home: expected exactly one <h1> in the prerendered HTML');
for (const text of ['Demo estática para portfólio: dados simulados no navegador.', 'EQUIPE ALPHACOMPLABS', 'Gustavo Martins Gripaldi', 'Elisa Nunes de Freitas', 'Diogo Freitas', 'Caio Silveira', 'Mayron Malaquias', 'Pedro Borges'])
  must(home.includes(text), `home: "${text}" missing from the prerendered HTML`);
must(home.includes('href="https://g2portfolio.grovicdata.com/projetos/rr-nexus/"'), 'home: portfolio link missing');
must(home.includes('href="https://github.com/AlphaCompLabs/Projeto-RR-Nexus"'), 'home: GitHub repo link missing');
try {
  const ld = JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '');
  must(ld['@type'] === 'WebApplication' && ld.url === SITE, 'JSON-LD is not a WebApplication for the site');
  const creators = ld.creator as Record<string, string>[];
  must(Array.isArray(creators) && creators.length >= 6 && creators.every((c) => c['@type'] === 'Person' && c['name']), 'JSON-LD creator must be an array of Person');
  must(JSON.stringify(creators?.[0]) === JSON.stringify(PERSON), 'JSON-LD creator[0] must be the portfolio Person');
} catch { fails.push('invalid JSON-LD'); }

// App-route shells and 404: noindex, same base, no canonical
for (const shell of ['404.html', 'meu-perfil/index.html']) {
  if (!existsSync(new URL(shell, docs))) { fails.push(`missing ${shell}`); continue; }
  const h = read(shell);
  must(h.includes('<meta name="robots" content="noindex, follow">'), `${shell}: should be noindex`);
  must(!h.includes('rel="canonical"'), `${shell}: should not carry the home canonical`);
  must(h.includes('<base href="/Projeto-RR-Nexus/">'), `${shell}: wrong base href`);
}
for (const f of ['.nojekyll', 'favicon.ico', 'robots.txt', 'sitemap.xml']) must(existsSync(new URL(f, docs)), `missing ${f}`);
must(read('robots.txt').includes(`Sitemap: ${SITE}sitemap.xml`), 'robots.txt without sitemap');
must(read('sitemap.xml').includes(`<loc>${SITE}</loc>`), 'sitemap.xml without the home URL');

// Every text file of the build
const walk = (dir: URL): URL[] => readdirSync(dir).flatMap((n) => {
  const p = new URL(n, dir);
  return statSync(p).isDirectory() ? walk(new URL(`${n}/`, dir)) : [p];
});
const files = walk(docs).filter((f) => /\.(html|js|css|json|txt|xml)$/.test(f.pathname) && !f.pathname.endsWith('3rdpartylicenses.txt'));
const name = (f: URL) => decodeURIComponent(f.pathname.split('/docs/')[1]);
const js = files.filter((f) => f.pathname.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
must(js.includes('rr-nexus-demo-db'), 'demo API missing from the bundle (build without --configuration demo?)');
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  must(!/["'(]\/assets\//.test(t), `${name(f)}: absolute /assets/ path breaks under the base href`);
  must(!/mongodb(\+srv)?:\/\//i.test(t), `${name(f)}: database URI in the published site`);
  for (const [url] of t.matchAll(/https:\/\/g2portfolio\.grovicdata\.com[^"'\s<)#?]*/g)) must(url.endsWith('/'), `${name(f)}: portfolio link without trailing slash ${url}`);
}

// No em dash in anything a visitor reads (build output) nor in the docs written for the demo.
const EM_DASH = String.fromCharCode(0x2014);
for (const f of [...files, new URL('README.md', repo), new URL('CLAUDE.md', repo)].filter((f) => existsSync(f)))
  must(!readFileSync(f, 'utf8').includes(EM_DASH), `em dash in ${f.pathname.includes('/docs/') ? name(f) : f.pathname.split('/').pop()}`);

if (fails.length) { console.error(`check: ${fails.length} problem(s)\n- ` + [...new Set(fails)].join('\n- ')); process.exit(1); }
console.log(`check: SEO, shells, base paths, ${files.length} text files OK, no em dash`);
