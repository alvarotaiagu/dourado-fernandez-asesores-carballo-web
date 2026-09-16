/* Verificación de la web de Dourado & Fernández con Playwright.
   Requiere un servidor local: python -m http.server 8952
   Uso: NODE_PATH=<ruta node_modules> node scripts/verify.js            */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.DYF_URL || 'http://127.0.0.1:8952/';
const RAIZ = path.join(__dirname, '..');
const CAPS = path.join(RAIZ, 'screenshots');
fs.mkdirSync(CAPS, { recursive: true });

const resultados = [];
const ok = (nombre, valor, detalle) => resultados.push({ prueba: nombre, ok: !!valor, detalle: detalle === undefined ? null : detalle });

async function nuevaPagina(browser, opciones = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opciones });
  const errores = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.errores = errores;
  return page;
}

const angulo = m => Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 100) / 100;

(async () => {
  const browser = await chromium.launch();

  /* ---------- 1. carga y el libro que cuadra ---------- */
  {
    const page = await nuevaPagina(browser);
    await page.addInitScript(() => {
      window.__longtasks = [];
      new PerformanceObserver(l => l.getEntries().forEach(e =>
        window.__longtasks.push({ inicio: Math.round(e.startTime), dur: Math.round(e.duration) })))
        .observe({ entryTypes: ['longtask'] });
    });
    await page.goto(BASE, { waitUntil: 'load' });

    /* a mitad de intro las columnas todavía deben estar descuadradas */
    await page.waitForTimeout(650);
    const mitad = await page.evaluate(() => Array.from(document.querySelectorAll('.libro-col')).map(c => {
      const m = new DOMMatrix(getComputedStyle(c).transform);
      return { y: Math.round(m.f), rot: Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 100) / 100 };
    }));
    ok('las columnas entran descuadradas', mitad.some(c => Math.abs(c.y) > 4 || Math.abs(c.rot) > 0.2), mitad);

    await page.waitForTimeout(4200);
    ok('sin errores JS en la portada', page.errores.length === 0, page.errores);

    const libro = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll('.libro-col')).map(c => {
        const m = new DOMMatrix(getComputedStyle(c).transform);
        return { y: Math.round(m.f * 100) / 100, rot: Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 100) / 100, op: getComputedStyle(c).opacity };
      });
      const cifras = Array.from(document.querySelectorAll('.lc.cifra')).map(c => ({ t: c.textContent.trim(), fin: c.dataset.final, ok: c.classList.contains('cuadrado') }));
      const totales = Array.from(document.querySelectorAll('.cifra-total')).map(t => t.textContent.trim());
      const regla = new DOMMatrix(getComputedStyle(document.querySelector('.libro-regla')).transform).a;
      const sello = getComputedStyle(document.querySelector('.libro-sello')).opacity;
      return { cols, cifras, totales, regla, sello };
    });
    ok('las columnas quedan alineadas (y=0, rotación 0)', libro.cols.every(c => Math.abs(c.y) < 0.5 && Math.abs(c.rot) < 0.1 && parseFloat(c.op) > 0.95), libro.cols);
    ok('todas las cifras se resuelven a su valor final', libro.cifras.every(c => c.t === c.fin && c.ok), libro.cifras);
    ok('el total cuadra en las dos columnas', libro.totales.join('/') === '7.786,00/7.786,00', libro.totales);
    ok('la regla se dibuja y el sello ✓ aparece', libro.regla > 0.99 && parseFloat(libro.sello) > 0.95, { regla: libro.regla, sello: libro.sello });

    /* el wordmark: la D en oro y el & y la F en plata, con el char-reveal completo */
    const wm = await page.evaluate(() => {
      const chars = Array.from(document.querySelectorAll('.hero-wm .ch'));
      const oro = document.querySelector('.hero-wm .ch.wm-oro');
      const plata = document.querySelectorAll('.hero-wm .ch.wm-plata');
      return {
        chars: chars.length,
        visibles: chars.filter(c => parseFloat(getComputedStyle(c).opacity) > 0.95).length,
        oroBg: oro ? getComputedStyle(oro).backgroundImage.slice(0, 15) : null,
        plata: plata.length,
        texto: document.querySelector('.hero-wm').getAttribute('aria-label')
      };
    });
    ok('char-reveal del wordmark completado', wm.chars > 0 && wm.visibles === wm.chars, wm);
    ok('la D lleva el degradado oro y & y F el plata', wm.oroBg === 'linear-gradient' && wm.plata === 2, wm);
    ok('el wordmark conserva el texto íntegro en aria-label', wm.texto === 'Dourado & Fernández', wm.texto);

    const lt = await page.evaluate(() => {
      const fin = performance.timing.loadEventEnd - performance.timing.navigationStart;
      return { todos: window.__longtasks || [], load: fin };
    });
    const trasLoad = lt.todos.filter(t => t.inicio >= lt.load && t.dur > 50);
    ok('sin longtasks >50ms en la intro (tras load)', trasLoad.length === 0, lt);

    await page.screenshot({ path: path.join(CAPS, 'hero-1440.png') });

    /* en la portada, la regla de márgenes y el WhatsApp aún no se ven y el tick está arriba */
    const flotAntes = await page.evaluate(() => {
      const wa = document.querySelector('.whatsapp-wrap').getBoundingClientRect();
      const banner = document.querySelector('.cookie-banner').getBoundingClientRect();
      const solapaConCookie = !(wa.right < banner.left || wa.left > banner.right || wa.bottom < banner.top || wa.top > banner.bottom);
      return {
        margen: parseFloat(getComputedStyle(document.querySelector('.margen')).opacity),
        wa: parseFloat(getComputedStyle(document.querySelector('.whatsapp-wrap')).opacity),
        tick: parseFloat(document.querySelector('.margen-tick').style.top),
        marcas: document.querySelectorAll('.margen-marca').length,
        solapaConCookie
      };
    });
    ok('en la portada la regla de progreso está oculta y hay 6 marcas', flotAntes.margen < 0.05 && flotAntes.tick < 1 && flotAntes.marcas === 6, flotAntes);
    ok('el WhatsApp es visible desde la carga, sin esperar a hacer scroll', flotAntes.wa > 0.95, flotAntes.wa);
    ok('el aviso de cookies (abierto) no tapa el botón de WhatsApp', !flotAntes.solapaConCookie, flotAntes);

    /* ---------- 2. cookies ---------- */
    ok('el aviso de cookies aparece', await page.isVisible('.cookie-banner'));
    await page.click('.cookie-ack');
    await page.waitForTimeout(300);
    const bannerCerrado = await page.evaluate(() => {
      const b = document.querySelector('.cookie-banner');
      return b.hidden && getComputedStyle(b).display === 'none';
    });
    ok('el botón de cookies cierra el aviso de verdad', bannerCerrado);
    ok('el aviso se recuerda en localStorage', (await page.evaluate(() => localStorage.getItem('dyf-cookie-ack'))) === '1');

    /* ---------- 3. recorrido completo y longtasks de scroll ---------- */
    await page.evaluate(() => { window.__longtasks.length = 0; });
    const alto = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < alto; y += 700) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(800);
    const ltScroll = await page.evaluate(() => window.__longtasks || []);
    ok('sin longtasks >50ms durante el scroll', ltScroll.filter(t => t.dur > 50).length === 0, ltScroll);
    ok('sin errores JS tras recorrer la página', page.errores.length === 0, page.errores);

    /* todos los bloques .cuadrar han quedado a 0 de giro y visibles */
    const cuadrados = await page.evaluate(() => Array.from(document.querySelectorAll('.cuadrar')).map(el => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return { op: parseFloat(getComputedStyle(el).opacity), rot: Math.abs(Math.atan2(m.b, m.a)), x: Math.abs(m.e) };
    }));
    ok('todos los bloques entran y quedan cuadrados', cuadrados.every(c => c.op > 0.95 && c.rot < 0.002 && c.x < 0.5), cuadrados.filter(c => !(c.op > 0.95 && c.rot < 0.002 && c.x < 0.5)));

    /* ---------- 4. sticky stack ---------- */
    await page.evaluate(() => {
      const l = document.querySelector('.stack-lista');
      window.scrollTo(0, l.getBoundingClientRect().top + window.scrollY + l.offsetHeight * 0.5);
    });
    await page.waitForTimeout(1300);
    const stack = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.stack-lista .tarjeta')).map(c => ({
        op: parseFloat(getComputedStyle(c).opacity),
        top: Math.round(c.getBoundingClientRect().top),
        scale: Math.round(new DOMMatrix(getComputedStyle(c).transform).a * 1000) / 1000
      }));
      return {
        indice: document.querySelector('[data-indice]').textContent.trim(),
        cifra: document.querySelector('[data-renglon-cifra]').textContent.trim(),
        marca: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.stack .regla-marca')).transform).e),
        cards
      };
    });
    ok('el stack avanza de índice y mueve la regla', stack.indice !== '01' && stack.marca > 0, stack);
    ok('la tarjeta activa es visible y está sobre las anteriores', stack.cards[2].op > 0.95 && stack.cards[2].top > stack.cards[1].top && stack.cards[2].top < 220, stack.cards);
    ok('las tarjetas tapadas se encogen hacia el fondo', stack.cards[0].scale < 0.99 && stack.cards[1].scale < 0.99, stack.cards);
    ok('el renglón de cifra cambia con la tarjeta', stack.cifra === '1' && stack.indice === '03', stack);
    await page.screenshot({ path: path.join(CAPS, 'stack-1440.png') });

    /* ---------- 5. contadores ---------- */
    await page.evaluate(() => {
      const s = document.querySelector('#por-que .balance');
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 200);
    });
    await page.waitForTimeout(2200);
    const balance = await page.evaluate(() => ({
      nota: document.querySelector('.balance-saldo [data-contador="4.2"]').textContent.trim(),
      resenas: document.querySelector('.balance-saldo [data-contador="5"]').textContent.trim(),
      regla: new DOMMatrix(getComputedStyle(document.querySelector('.balance-saldo .regla-cifra')).transform).a
    }));
    ok('la valoración cuenta hasta 4,2 y 5 reseñas', balance.nota === '4,2' && balance.resenas === '5', balance);
    ok('la regla bajo la cifra se dibuja', balance.regla > 0.99, balance.regla);

    await page.evaluate(() => {
      const s = document.querySelector('#calendario .mayor');
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 150);
    });
    await page.waitForTimeout(2200);
    const cal = await page.evaluate(() => ({
      dias: Array.from(document.querySelectorAll('.mayor-fila .num[data-contador]')).map(e => e.textContent.trim()),
      proximo: document.querySelector('.mayor-fila.proximo') ? document.querySelector('.mayor-fila.proximo .mes').textContent.trim() : null
    }));
    ok('los plazos en días cuentan hasta su valor', cal.dias.join(',') === '30,31,20,90,20,25,20', cal.dias);
    ok('se marca un único plazo como próximo', !!cal.proximo, cal.proximo);
    await page.screenshot({ path: path.join(CAPS, 'calendario-1440.png') });

    await page.evaluate(() => {
      const s = document.querySelector('#resenas');
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 100);
    });
    await page.waitForTimeout(2200);
    ok('la cifra de reseñas llega a 4,2', (await page.evaluate(() => document.querySelector('.nota-cifra').textContent.trim())) === '4,2');

    /* ---------- 6. mapa por consentimiento ---------- */
    await page.evaluate(() => {
      const s = document.querySelector('.map-consent');
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 300);
    });
    await page.waitForTimeout(900);
    ok('no hay iframe de Google antes de pedirlo', (await page.evaluate(() => document.querySelectorAll('iframe').length)) === 0);
    await page.click('[data-map]');
    await page.waitForTimeout(1200);
    const iframe = await page.evaluate(() => { const f = document.querySelector('iframe'); return f ? f.src : null; });
    ok('el mapa se carga solo al pulsar, sin API key', !!iframe && iframe.includes('google.com/maps?q=') && iframe.includes('output=embed') && !iframe.includes('key='), iframe);
    await page.screenshot({ path: path.join(CAPS, 'contacto-1440.png') });

    /* ---------- 7. diálogos legales y cabecera sobre el pie ---------- */
    await page.click('[data-dialog="dlg-legal"]');
    await page.waitForTimeout(400);
    ok('el aviso legal se abre', await page.evaluate(() => document.getElementById('dlg-legal').open));
    await page.click('#dlg-legal [data-cerrar]');
    await page.waitForTimeout(300);
    ok('el aviso legal se cierra', await page.evaluate(() => !document.getElementById('dlg-legal').open));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    /* la cabecera solo cambia a tinta clara si el pie llega a quedar debajo de ella
       (con un pie más bajo que el viewport nunca se solapan) */
    const pie = await page.evaluate(() => ({
      solapa: document.querySelector('.pie').getBoundingClientRect().top <= 38,
      claro: document.querySelector('.top').classList.contains('top--claro')
    }));
    ok('la cabecera pasa a tinta clara solo cuando el pie verde queda debajo', pie.claro === pie.solapa, pie);

    /* ---------- 7b. regla de márgenes y WhatsApp ---------- */
    await page.waitForTimeout(900);
    const flotFin = await page.evaluate(() => ({
      margen: parseFloat(getComputedStyle(document.querySelector('.margen')).opacity),
      wa: parseFloat(getComputedStyle(document.querySelector('.whatsapp-wrap')).opacity),
      tick: parseFloat(document.querySelector('.margen-tick').style.top),
      cuadradas: document.querySelectorAll('.margen-marca.cuadra').length,
      actual: document.querySelector('.margen-marca.actual b') ? document.querySelector('.margen-marca.actual b').textContent : null,
      pie: document.querySelector('.margen').classList.contains('margen--pie'),
      alineadas: Array.from(document.querySelectorAll('.margen-marca.cuadra b')).every(b => { const m = new DOMMatrix(getComputedStyle(b).transform); return Math.abs(m.e) < 0.5 && Math.abs(Math.atan2(m.b, m.a)) < 0.002; }),
      href: document.querySelector('.whatsapp').href
    }));
    ok('al final del scroll el tick llega abajo y las 6 marcas se han cuadrado', flotFin.tick > 99 && flotFin.cuadradas === 6 && flotFin.alineadas, flotFin);
    ok('la marca actual es la 06 y la regla pasa a tinta clara sobre el pie', flotFin.actual === '06' && flotFin.pie, flotFin);
    ok('la regla de márgenes y el WhatsApp son visibles fuera de la portada', flotFin.margen > 0.95 && flotFin.wa > 0.95, flotFin);
    ok('el WhatsApp enlaza a wa.me con el teléfono del despacho', flotFin.href.startsWith('https://wa.me/34981702760'), flotFin.href);

    /* a mitad de página: unas marcas cuadradas y otras no, y las marcas llevan a su sección */
    await page.evaluate(() => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * 0.5));
    await page.waitForTimeout(1000);
    const flotMitad = await page.evaluate(() => ({
      cuadradas: document.querySelectorAll('.margen-marca.cuadra').length,
      tick: parseFloat(document.querySelector('.margen-tick').style.top),
      pie: document.querySelector('.margen').classList.contains('margen--pie')
    }));
    ok('a mitad de página el tick va por la mitad y solo parte de las marcas están cuadradas', flotMitad.tick > 40 && flotMitad.tick < 60 && flotMitad.cuadradas > 1 && flotMitad.cuadradas < 6 && !flotMitad.pie, flotMitad);
    await page.click('.margen-marca:nth-of-type(4)');
    await page.waitForTimeout(1600);
    const salto = await page.evaluate(() => Math.abs(document.querySelector('#equipo').getBoundingClientRect().top));
    ok('pulsar una marca lleva a su sección', salto < 60, salto);
    await page.evaluate(() => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * 0.5));
    await page.waitForTimeout(800);

    /* la etiqueta del WhatsApp se despliega al pasar el ratón */
    const anchoAntes = await page.evaluate(() => document.querySelector('.whatsapp').getBoundingClientRect().width);
    await page.hover('.whatsapp');
    await page.waitForTimeout(700);
    const anchoDespues = await page.evaluate(() => document.querySelector('.whatsapp').getBoundingClientRect().width);
    ok('la etiqueta del WhatsApp se despliega al pasar el ratón', anchoDespues > anchoAntes + 80, { anchoAntes, anchoDespues });
    await page.screenshot({ path: path.join(CAPS, 'regla-1440.png') });
    await page.screenshot({ path: path.join(CAPS, 'pie-1440.png') });

    await page.close();
  }

  /* ---------- 8. reduced motion ---------- */
  {
    const page = await nuevaPagina(browser, { reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const estado = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll('.libro-col')).map(c => {
        const m = new DOMMatrix(getComputedStyle(c).transform);
        return Math.abs(m.f) + Math.abs(Math.atan2(m.b, m.a));
      });
      return {
        columnas: Math.max(...cols),
        cifras: Array.from(document.querySelectorAll('.lc.cifra')).every(c => c.textContent.trim() === c.dataset.final),
        total: document.querySelector('.cifra-total').textContent.trim(),
        sello: getComputedStyle(document.querySelector('.libro-sello')).opacity,
        bloque: getComputedStyle(document.querySelector('.seccion-cab.cuadrar')).opacity,
        lenis: document.documentElement.classList.contains('lenis'),
        wm: getComputedStyle(document.querySelector('.hero-wm .ch')).opacity
      };
    });
    ok('reduced-motion: las columnas ya están cuadradas', estado.columnas < 0.01, estado);
    ok('reduced-motion: cifras, total y sello ya resueltos', estado.cifras && estado.total === '7.786,00' && parseFloat(estado.sello) > 0.95, estado);
    ok('reduced-motion: los bloques ya son visibles', parseFloat(estado.bloque) > 0.95 && parseFloat(estado.wm) > 0.95, estado);
    ok('reduced-motion: sin smooth scroll (Lenis)', estado.lenis === false, estado);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const rmProg = await page.evaluate(() => ({
      tick: parseFloat(document.querySelector('.margen-tick').style.top),
      cuadradas: document.querySelectorAll('.margen-marca.cuadra').length,
      wa: parseFloat(getComputedStyle(document.querySelector('.whatsapp-wrap')).opacity)
    }));
    ok('reduced-motion: la regla sigue el scroll sin suavizado y el WhatsApp está visible', rmProg.tick > 99 && rmProg.cuadradas === 6 && rmProg.wa > 0.95, rmProg);
    ok('reduced-motion sin errores JS', page.errores.length === 0, page.errores);
    await page.screenshot({ path: path.join(CAPS, 'reduced-motion.png') });
    await page.close();
  }

  /* ---------- 9. sin JavaScript ---------- */
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    ok('sin JS: los titulares siguen visibles', await page.isVisible('.seccion-cab .titular'));
    ok('sin JS: el aviso de cookies no aparece', !(await page.isVisible('.cookie-banner')));
    ok('sin JS: no hay iframe de Google', (await page.locator('iframe').count()) === 0);
    await page.screenshot({ path: path.join(CAPS, 'sin-js.png') });
    await context.close();
  }

  /* ---------- 10. responsive y menú móvil ---------- */
  for (const [w, h] of [[1440, 900], [1024, 800], [768, 900], [400, 860], [360, 780]]) {
    const page = await nuevaPagina(browser, { viewport: { width: w, height: h } });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(3600);
    if (w === 400) {
      const libro = await page.evaluate(() => {
        const l = document.querySelector('.libro');
        const cols = Array.from(l.querySelectorAll('.libro-col')).map(c => c.getBoundingClientRect());
        const hero = document.querySelector('.hero-int');
        return {
          apiladas: getComputedStyle(hero).gridTemplateColumns.split(' ').length === 1,
          ancho: Math.round(l.getBoundingClientRect().width),
          desborda: cols.some(c => c.right > window.innerWidth + 1),
          recortes: Array.from(l.querySelectorAll('.lc')).filter(c => c.scrollWidth > c.clientWidth + 1).length
        };
      });
      ok('a 400px el hero apila texto y libro en una columna', libro.apiladas, libro);
      ok('a 400px el libro cabe sin recortar cifras', !libro.desborda && libro.recortes === 0, libro);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(900);
      const flotMovil = await page.evaluate(() => {
        const wa = document.querySelector('.whatsapp').getBoundingClientRect();
        const tick = document.querySelector('.margen-tick');
        const t = tick.getBoundingClientRect();
        const m = document.querySelector('.margen').getBoundingClientRect();
        return {
          marcasOcultas: Array.from(document.querySelectorAll('.margen-marca')).every(b => getComputedStyle(b).display === 'none'),
          punto: getComputedStyle(tick).borderRadius === '50%' && Math.round(t.width) === 9,
          tickVisible: t.right <= innerWidth && t.top > 0,
          sinSolape: m.bottom < wa.top,
          waVisible: parseFloat(getComputedStyle(document.querySelector('.whatsapp-wrap')).opacity) > 0.95 && wa.right <= innerWidth && wa.bottom <= innerHeight
        };
      });
      ok('a 400px la regla se reduce al punto, sin marcas y sin solapar el WhatsApp', flotMovil.marcasOcultas && flotMovil.punto && flotMovil.tickVisible && flotMovil.sinSolape && flotMovil.waVisible, flotMovil);
      await page.screenshot({ path: path.join(CAPS, 'hero-400.png') });
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(700);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`sin scroll horizontal a ${w}px`, desborde <= 1, desborde);
    if (w <= 1000) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.click('.menu-btn');
      await page.waitForTimeout(500);
      ok(`menú móvil abre a ${w}px`, await page.isVisible('.menu-movil'));
      await page.click('.menu-movil a[href="#contacto"]');
      await page.waitForTimeout(900);
      ok(`menú móvil cierra al navegar a ${w}px`, !(await page.isVisible('.menu-movil')));
    }
    if (w === 400 || w === 1440) await page.screenshot({ path: path.join(CAPS, `pagina-${w}.png`), fullPage: true });
    ok(`sin errores JS a ${w}px`, page.errores.length === 0, page.errores);
    await page.close();
  }

  await browser.close();

  const fallos = resultados.filter(r => !r.ok);
  const informe = { fecha: new Date().toISOString(), url: BASE, total: resultados.length, fallos: fallos.length, resultados };
  fs.writeFileSync(path.join(__dirname, 'verify-report.json'), JSON.stringify(informe, null, 2));
  resultados.forEach(r => console.log((r.ok ? 'OK   ' : 'FALLO') + '  ' + r.prueba + (r.ok ? '' : '  ' + JSON.stringify(r.detalle))));
  console.log('\n' + (resultados.length - fallos.length) + '/' + resultados.length + ' pruebas OK');
  process.exit(fallos.length ? 1 : 0);
})();
