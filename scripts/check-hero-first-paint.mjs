// Run with the site running: node scripts/check-hero-first-paint.mjs
// Open the printed address at desktop/mobile widths. It must report PASS.
// /critical keeps the actual SSR markup and head styles, but omits page JS/CSS.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
const site = process.env.HERO_CHECK_SITE || 'http://localhost:3001'
const globalCSS = (
  await postcss([tailwindcss('./tailwind.config.js')]).process(
    await readFile('src/styles/tailwind.css', 'utf8'),
    { from: 'src/styles/tailwind.css' }
  )
).css

const probe = `<script>
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const heading = document.querySelector('h1');
    const panel = document.querySelector('#hero-demo-panel');
    const video = panel.querySelector('video');
    const backdrop = document.querySelector('[data-hero-backdrop]');
    const b = backdrop.getBoundingClientRect();
    const hero = backdrop.parentElement.getBoundingClientRect();
    const h = heading.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const v = video.getBoundingClientRect();
    const checks = {
      titleSized: parseFloat(getComputedStyle(heading).fontSize) >= 34,
      belowTitle: v.top > h.bottom,
      contained: v.left >= p.left - 1 && v.right <= p.right + 1 && v.top >= p.top - 1 && v.bottom <= p.bottom + 1,
      reserved: p.height > 100 && Math.abs(p.width / p.height - 16 / 9) < 0.01,
      boundedWidth: p.width <= 1120 && p.right <= innerWidth && p.left >= 0,
      oneBackground: document.querySelectorAll('[data-hero-backdrop]').length === 1 && !document.querySelector('canvas'),
      backgroundPresent: getComputedStyle(backdrop).visibility === 'visible' && getComputedStyle(backdrop).position === 'absolute' && backdrop.querySelector('svg').getBoundingClientRect().height === b.height,
      backgroundCoverage: Math.abs(b.height - hero.height) < 0.5 && b.bottom >= p.bottom + 80,
    };
    const result = document.createElement('output');
    result.id = 'first-paint-result';
    result.dataset.pass = String(Object.values(checks).every(Boolean));
    const metrics = {headingTop:h.top, videoTop:v.top, panelWidth:p.width, panelHeight:p.height, backdropWidth:b.width, backdropHeight:b.height};
    result.textContent = (result.dataset.pass === 'true' ? 'PASS' : 'FAIL') + ' ' + JSON.stringify({checks, ...metrics});
    result.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:10000;padding:12px;background:#fff;color:#000;font:12px monospace';
    document.body.append(result);
    if (parent !== window) parent.postMessage({kind:'hero-first-paint', mode:location.pathname, pass:result.dataset.pass === 'true', metrics}, location.origin);
  }));
</script>`

const server = createServer(async (request, response) => {
  if (request.url === '/') {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }).end(`<!doctype html>
      <html><head><title>Hero first-paint regression</title><style>
      html,body {margin:0;background:#07080a} iframe {display:block;border:0;width:100%;height:100vh}
      output {position:fixed;bottom:0;left:0;right:0;z-index:1;padding:12px;background:white;color:black;font:12px monospace}
      </style></head><body>
      <iframe src="/critical" title="Before page CSS"></iframe><iframe src="/styled" title="After page CSS"></iframe>
      <output id="comparison-result">Waiting for both first paints…</output>
      <script>
      const results = {};
      addEventListener('message', event => {
        if (event.origin !== location.origin || event.data?.kind !== 'hero-first-paint') return;
        results[event.data.mode] = event.data;
        if (!results['/critical'] || !results['/styled']) return;
        const early = results['/critical'], ready = results['/styled'];
        const deltas = Object.fromEntries(Object.keys(early.metrics).map(key => [key, ready.metrics[key] - early.metrics[key]]));
        const pass = early.pass && ready.pass && Object.values(deltas).every(value => Math.abs(value) < 0.5);
        const output = document.querySelector('#comparison-result');
        output.dataset.pass = String(pass);
        output.textContent = (pass ? 'PASS' : 'FAIL') + ' critical → styled: ' + JSON.stringify(deltas);
      });
      </script></body></html>`)
    return
  }
  if (!['/critical', '/styled'].includes(request.url)) {
    response.writeHead(404).end('Open /critical or /styled')
    return
  }
  try {
    const upstream = await fetch(site)
    if (!upstream.ok) throw new Error(`Homepage returned ${upstream.status}`)
    let html = await upstream.text()
    const names = Object.fromEntries(
      [...html.matchAll(/Home_([A-Za-z][A-Za-z0-9_]*?)__[A-Za-z0-9_-]+/g)].map(
        (match) => [match[1], match[0]]
      )
    )
    // Keep the real Hero and its ancestors. No lower sections or app scripts
    // are needed to reproduce the escaping video.
    const heroEnd = html.indexOf('<section id="models"')
    if (heroEnd < 0) throw new Error('Expected the homepage Hero followed by #models')
    html = html.slice(0, heroEnd) + '</main></div></div></body></html>'
    html = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style\b[^>]*data-next-hide-fouc[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '')
    let css = globalCSS
    if (request.url === '/styled') {
      css += (await readFile('src/styles/Home.module.css', 'utf8')).replace(
        /\.([A-Za-z][A-Za-z0-9_]*)/g,
        (_, name) => '.' + (names[name] || name)
      )
    }
    html = html
      .replace('<head>', `<head><base href="${site}/">`)
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `${probe}</body>`)
    response
      .writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      .end(html)
  } catch (error) {
    response.writeHead(500).end(String(error))
  }
})

server.listen(0, '127.0.0.1', () => {
  console.log(
    `Hero first-paint checks: http://localhost:${
      server.address().port
    }/ (also /critical and /styled)`
  )
})
