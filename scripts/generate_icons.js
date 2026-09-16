/* Iconos PNG e imagen Open Graph a partir de los SVG de marca.
   Se rasteriza con Playwright para no depender de librerías de imagen en Node.
   Uso: NODE_PATH=<ruta a node_modules> node scripts/generate_icons.js */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const LOGO = path.join(RAIZ, 'assets', 'img', 'logo');
const TAMANOS = [96, 180, 192, 512];

(async () => {
  const icon = fs.readFileSync(path.join(LOGO, 'icon.svg'), 'utf8');
  const claro = fs.readFileSync(path.join(LOGO, 'logo-claro.svg'), 'utf8');
  const browser = await chromium.launch();

  for (const size of TAMANOS) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<body style="margin:0;width:${size}px;height:${size}px;background:#5E7F6B">` +
      `<div style="width:${size}px;height:${size}px">${icon.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"')}</div></body>`
    );
    await page.screenshot({ path: path.join(LOGO, `icon-${size}.png`) });
    await page.close();
    console.log('icon-' + size + '.png');
  }

  /* Open Graph 1200x630: la pared verde con el wordmark claro y los datos reales */
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<!doctype html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
    </head><body style="margin:0;width:1200px;height:630px;background:#2F4A3E;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:44px;
      background-image:repeating-linear-gradient(to bottom, transparent 0 35px, rgba(245,241,230,.07) 35px 36px)">
      <div style="width:880px">${claro.replace(/width="\d+" height="\d+"/, 'width="100%" height="auto"')}</div>
      <p style="margin:0;font-family:Inter,sans-serif;font-weight:500;font-size:19px;letter-spacing:.3em;
        text-transform:uppercase;color:#C7CDD1">Asesores · Carballo · 981 70 27 60 · 4,2 ★ Google</p>
    </body></html>`);
  await og.waitForTimeout(1200);
  await og.screenshot({ path: path.join(LOGO, 'og.png') });
  console.log('og.png');

  await browser.close();
})();
