/* Dourado & Fernández · "Balance"
   Todo el movimiento es el mismo gesto: algo entra descuadrado y se cuadra.
   En la portada, tres columnas de un asiento contable llegan desplazadas y
   con interrogaciones, se alinean, las cifras se resuelven y el total cierra
   con un ✓. El resto de bloques entra desplazado y girado apenas y se corrige
   al llegar a su sitio en el scroll. Sin canvas, sin shaders. */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Si GSAP no llega (CDN bloqueado), la página se queda estática y legible:
     nada se oculta porque la clase .gsap nunca se añade. */
  if (!window.gsap || !window.ScrollTrigger) {
    doc.classList.remove("js");
    iniciarBasico();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add("gsap");

  /* ---------- smooth scroll ---------- */

  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function irA(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 10;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- char reveal (conserva los spans de color del wordmark) ---------- */

  function partir(el) {
    var texto = el.textContent.replace(/\s+/g, " ").trim();
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", texto);
    var chars = [];
    var nodos = Array.prototype.slice.call(el.childNodes);
    el.textContent = "";

    function meterTexto(txt, contenedor) {
      var palabras = txt.split(/(\s+)/);
      palabras.forEach(function (palabra) {
        if (!palabra) return;
        if (/^\s+$/.test(palabra)) { contenedor.appendChild(document.createTextNode(" ")); return; }
        var wrap = document.createElement("span");
        wrap.className = "pal";
        wrap.setAttribute("aria-hidden", "true");
        palabra.split("").forEach(function (c) {
          var mask = document.createElement("span");
          mask.className = "ch-mask";
          var ch = document.createElement("span");
          ch.className = "ch";
          ch.textContent = c;
          mask.appendChild(ch);
          wrap.appendChild(mask);
          chars.push(ch);
        });
        contenedor.appendChild(wrap);
      });
    }

    nodos.forEach(function (n) {
      if (n.nodeType === 3) { meterTexto(n.textContent, el); return; }
      if (n.nodeType === 1) {
        /* un span de color (oro/plata) se parte por dentro; el degradado con
           background-clip:text no atraviesa los spans transformados, así que
           la clase de color pasa a cada letra y el contenedor se queda neutro */
        var grupo = document.createElement("span");
        grupo.className = "wm-grupo";
        var antes = chars.length;
        meterTexto(n.textContent, grupo);
        for (var k = antes; k < chars.length; k++) chars[k].classList.add(n.className);
        el.appendChild(grupo);
      }
    });
    return chars;
  }

  var titulares = [];
  document.querySelectorAll("[data-reveal-chars]").forEach(function (el) {
    titulares.push({ el: el, chars: partir(el) });
  });

  function revelar(entrada, retraso) {
    if (reduce) { gsap.set(entrada.chars, { yPercent: 0, opacity: 1 }); return null; }
    return gsap.fromTo(entrada.chars,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.02, delay: retraso || 0 });
  }

  titulares.forEach(function (t) {
    if (t.el.classList.contains("hero-wm")) return;   // el hero lo dispara el libro
    if (reduce) { revelar(t); return; }
    gsap.set(t.chars, { yPercent: 110, opacity: 0 });
    ScrollTrigger.create({
      trigger: t.el, start: "top 86%", once: true,
      onEnter: function () { revelar(t); }
    });
  });

  /* ---------- formato de cifras ---------- */

  function formatear(v, dec) {
    var s = v.toFixed(dec);
    var partes = s.split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return partes.join(",");
  }

  /* ---------- hero: el libro que cuadra ---------- */

  var libro = document.querySelector(".libro");
  var heroWm = document.querySelector(".hero-wm");
  var heroChars = (titulares.filter(function (t) { return t.el === heroWm; })[0] || {}).chars || [];
  var heroResto = document.querySelectorAll(".hero-eyebrow, .hero-bajada, .hero-claim, .hero-acciones, .hero-datos, .hero-scroll");
  var movil = window.innerWidth < 760;

  if (libro && !reduce) {
    var cols = Array.prototype.slice.call(libro.querySelectorAll(".libro-col"));
    var cifras = Array.prototype.slice.call(libro.querySelectorAll(".lc.cifra"));
    var totales = Array.prototype.slice.call(libro.querySelectorAll(".cifra-total"));
    var regla = libro.querySelector(".libro-regla");
    var sello = libro.querySelector(".libro-sello");
    var factor = movil ? 0.5 : 1;

    cols.forEach(function (c) {
      gsap.set(c, {
        y: parseFloat(c.dataset.desvio) * factor,
        rotation: parseFloat(c.dataset.giro) * factor,
        opacity: 0,
        transformOrigin: "center center"
      });
    });
    gsap.set(heroChars, { yPercent: 110, opacity: 0 });
    gsap.set(heroResto, { y: 18, opacity: 0 });

    /* las cifras "se resuelven": unos cuantos dígitos al azar y luego el valor final */
    function resolver(el, dur) {
      var fin = el.dataset.final;
      var obj = { p: 0 };
      var digitos = fin.replace(/[^\d]/g, "").length || 3;
      return gsap.to(obj, {
        p: 1, duration: dur, ease: "power2.out",
        onUpdate: function () {
          if (obj.p < 0.75 && fin !== "—") {
            var s = "";
            for (var i = 0; i < digitos; i++) s += Math.floor(Math.random() * 10);
            if (s.length > 2) s = s.slice(0, -2) + "," + s.slice(-2);
            if (s.length > 6) s = s.slice(0, -6) + "." + s.slice(-6);
            el.textContent = s;
          } else {
            el.textContent = fin;
            el.classList.add("cuadrado");
          }
        }
      });
    }

    var tl = gsap.timeline({ delay: 0.2 });
    // 1. el wordmark entra
    tl.to(heroChars, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.03 }, 0)
      .to(heroResto, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.35)
      // 2. las columnas aparecen descuadradas y se deslizan a su sitio
      .to(cols, { opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 }, 0.3)
      .to(cols, { y: 0, rotation: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }, 0.75);
    // 3. las interrogaciones se resuelven en cifras, fila a fila
    cifras.forEach(function (c, i) {
      tl.add(resolver(c, 0.55), 1.35 + (i % 6) * 0.07 + Math.floor(i / 6) * 0.05);
    });
    // 4. la regla se dibuja, los totales suman y el sello cierra
    tl.to(regla, { scaleX: 1, duration: 0.7, ease: "power3.inOut" }, 2.0);
    totales.forEach(function (t) {
      var fin = parseFloat(t.dataset.contador);
      var dec = parseInt(t.dataset.decimales || "0", 10);
      var obj = { v: 0 };
      tl.to(obj, { v: fin, duration: 1.1, ease: "power3.out", onUpdate: function () { t.textContent = formatear(obj.v, dec); } }, 2.05);
    });
    tl.fromTo(sello, { opacity: 0, scale: 1.35, rotation: -9 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.5, ease: "power4.out" }, 2.95);
  } else if (libro) {
    /* reduced motion: todo ya cuadrado */
    libro.querySelectorAll(".lc.cifra").forEach(function (c) { c.textContent = c.dataset.final; c.classList.add("cuadrado"); });
    libro.querySelectorAll(".cifra-total").forEach(function (t) {
      t.textContent = formatear(parseFloat(t.dataset.contador), parseInt(t.dataset.decimales || "0", 10));
    });
    gsap.set(heroChars, { yPercent: 0, opacity: 1 });
    gsap.set(heroResto, { y: 0, opacity: 1 });
    gsap.set(".libro-col", { y: 0, rotation: 0, opacity: 1 });
  }

  /* ---------- cada bloque entra descuadrado y se corrige ---------- */

  var desvio = movil ? 12 : 28;

  document.querySelectorAll(".cuadrar").forEach(function (el, i) {
    var lado = el.dataset.lado === "der" ? 1 : el.dataset.lado === "izq" ? -1 : (i % 2 ? 1 : -1);
    if (reduce) { gsap.set(el, { opacity: 1, clearProps: "transform" }); return; }
    gsap.fromTo(el,
      { opacity: 0, x: desvio * lado * 0.6, y: 30, rotation: 0.9 * lado },
      {
        opacity: 1, x: 0, y: 0, rotation: 0,
        duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
  });

  /* las reglas bajo las cifras clave se dibujan al entrar */
  document.querySelectorAll(".regla-cifra").forEach(function (r) {
    if (reduce) { gsap.set(r, { scaleX: 1 }); return; }
    gsap.to(r, {
      scaleX: 1, duration: 0.9, ease: "power3.inOut",
      scrollTrigger: { trigger: r, start: "top 90%", once: true }
    });
  });

  /* ---------- cabecera ---------- */

  var top = document.querySelector(".top");
  ScrollTrigger.create({
    start: 40,
    onToggle: function (self) { top.classList.toggle("top--fijo", self.isActive); }
  });
  var mitadTop = (parseInt(getComputedStyle(doc).getPropertyValue("--alto-top")) || 76) / 2;
  ScrollTrigger.create({
    trigger: ".pie",
    start: "top " + mitadTop + "px",
    end: "bottom " + mitadTop + "px",
    onToggle: function (self) { top.classList.toggle("top--claro", self.isActive); }
  });

  var enlaces = Array.prototype.slice.call(document.querySelectorAll(".top-nav a"));
  enlaces.forEach(function (a) {
    var sec = document.querySelector(a.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: "top 45%", end: "bottom 45%",
      onToggle: function (self) {
        if (self.isActive) enlaces.forEach(function (o) { o.classList.toggle("activo", o === a); });
      }
    });
  });

  /* ---------- qué hacemos: sticky stack con la regla avanzando ---------- */

  var items = Array.prototype.slice.call(document.querySelectorAll(".stack-lista > li"));
  var indice = document.querySelector("[data-indice]");
  var renglonCifra = document.querySelector("[data-renglon-cifra]");
  var renglonTexto = document.querySelector("[data-renglon-texto]");
  var marcaStack = document.querySelector(".stack .regla-marca");
  var reglaStack = document.querySelector(".stack .regla");

  function moverMarca(p) {
    if (!marcaStack || !reglaStack) return;
    var ancho = reglaStack.getBoundingClientRect().width - 2;
    gsap.to(marcaStack, { x: ancho * p, duration: reduce ? 0 : 0.7, ease: "power4.out", overwrite: true });
  }

  var actual = -1;
  function activar(i) {
    if (i === actual) return;
    actual = i;
    var li = items[i];
    if (indice) indice.textContent = String(i + 1).padStart(2, "0");
    moverMarca(i / (items.length - 1));
    if (renglonCifra && renglonTexto) {
      var cifra = li.dataset.cifra, texto = li.dataset.texto;
      if (reduce) { renglonCifra.textContent = cifra; renglonTexto.textContent = texto; return; }
      gsap.to([renglonCifra, renglonTexto], {
        opacity: 0, y: -6, duration: 0.2, ease: "power2.in", overwrite: true,
        onComplete: function () {
          renglonCifra.textContent = cifra;
          renglonTexto.textContent = texto;
          gsap.fromTo([renglonCifra, renglonTexto], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.05 });
        }
      });
    }
  }

  items.forEach(function (li, i) {
    var card = li.querySelector(".tarjeta");
    ScrollTrigger.create({
      trigger: li, start: "top 55%", end: "bottom 45%",
      onToggle: function (self) { if (self.isActive) activar(i); }
    });
    if (reduce) return;
    /* la tarjeta entra descuadrada y se corrige */
    gsap.fromTo(card,
      { y: 34, rotation: 0.7, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 85%", once: true } });
    /* y al ser tapada por la siguiente, se encoge un poco hacia el fondo
       (solo escala: un scrub sobre la opacidad arrancaría en 0 y pisaría la entrada) */
    if (i < items.length - 1 && window.innerWidth > 480) {
      gsap.to(card, {
        scale: 0.965, ease: "none",
        scrollTrigger: { trigger: items[i + 1], start: "top 85%", end: "top 25%", scrub: true }
      });
    }
  });
  if (items.length) activar(0);

  /* ---------- contadores ---------- */

  document.querySelectorAll("[data-contador]").forEach(function (el) {
    if (el.classList.contains("cifra-total")) return;   // los del hero van en su timeline
    var fin = parseFloat(el.dataset.contador);
    var dec = parseInt(el.dataset.decimales || "0", 10);
    var pintar = function (v) { el.textContent = formatear(v, dec); };
    if (reduce) { pintar(fin); return; }
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        gsap.to(obj, { v: fin, duration: 1.5, ease: "power3.out", onUpdate: function () { pintar(obj.v); } });
      }
    });
  });

  /* ---------- calendario: marcar el próximo plazo (calculado, no inventado) ---------- */

  (function () {
    var filas = Array.prototype.slice.call(document.querySelectorAll(".mayor-fila[data-mes]"));
    if (!filas.length) return;
    var mes = new Date().getMonth() + 1;
    var candidata = null, mejor = 99;
    filas.forEach(function (f) {
      var m = parseInt(f.dataset.mes, 10);
      var fin = parseInt(f.dataset.mesFin || f.dataset.mes, 10);
      var dist = mes <= fin ? Math.max(0, m - mes) : (12 - mes) + m;
      if (dist < mejor) { mejor = dist; candidata = f; }
    });
    if (candidata) candidata.classList.add("proximo");
  })();

  /* ---------- progreso de scroll: el saldo que cuadra ---------- */

  var progreso = document.querySelector(".progreso");
  var topProgreso = document.querySelector(".top-progreso");
  var whatsapp = document.querySelector(".whatsapp-wrap");
  var progMarca = progreso && progreso.querySelector(".progreso-marca");
  var progCifra = progreso && progreso.querySelector("[data-progreso-cifra]");
  var progNum = progreso && progreso.querySelector("[data-progreso-num]");
  var progNombre = progreso && progreso.querySelector("[data-progreso-nombre]");
  var SALDO_FINAL = 7786;

  if (progreso && topProgreso) {
    var suave = { p: 0 };
    var ultimaCifra = "";
    var pintarProgreso = function () {
      var p = suave.p;
      gsap.set([topProgreso, progMarca], { scaleX: p });
      var texto = formatear(SALDO_FINAL * p, 2);
      if (texto !== ultimaCifra) { progCifra.textContent = texto; ultimaCifra = texto; }
      progreso.classList.toggle("progreso--cuadra", p > 0.985);
    };
    var irProgreso = reduce
      ? function (p) { suave.p = p; pintarProgreso(); }
      : gsap.quickTo(suave, "p", { duration: 0.55, ease: "power3.out", onUpdate: pintarProgreso });

    ScrollTrigger.create({
      trigger: document.body, start: "top top", end: "bottom bottom",
      onUpdate: function (self) { irProgreso(self.progress); }
    });
    pintarProgreso();

    /* el asiento actual */
    document.querySelectorAll("main .seccion").forEach(function (sec) {
      var eyebrow = sec.querySelector(".eyebrow");
      var h2 = sec.querySelector("h2");
      if (!eyebrow || !h2) return;
      var num = eyebrow.textContent.trim();
      var nombre = h2.getAttribute("aria-label") || h2.textContent.trim();
      ScrollTrigger.create({
        trigger: sec, start: "top 50%", end: "bottom 50%",
        onToggle: function (self) {
          if (!self.isActive || progNum.textContent === num) return;
          if (reduce) { progNum.textContent = num; progNombre.textContent = nombre; return; }
          gsap.to([progNum, progNombre], {
            opacity: 0, y: -4, duration: 0.18, ease: "power2.in", overwrite: true,
            onComplete: function () {
              progNum.textContent = num; progNombre.textContent = nombre;
              gsap.fromTo([progNum, progNombre], { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
            }
          });
        }
      });
    });

    /* la ficha y el WhatsApp aparecen al dejar atrás la portada */
    var flotantes = [progreso, whatsapp].filter(Boolean);
    if (reduce) {
      gsap.set(flotantes, { opacity: 1, y: 0 });
    } else {
      /* solo importa cruzar el inicio hacia abajo (aparecen) o hacia arriba (se van):
         con onToggle se irían también al llegar al final de la página (progress 1) */
      var mostrarFlotantes = function (si) {
        gsap.to(flotantes, { opacity: si ? 1 : 0, y: si ? 0 : 12, duration: 0.5, ease: "power3.out", stagger: 0.08, overwrite: true });
      };
      ScrollTrigger.create({
        trigger: ".marquee", start: "top 92%",
        onEnter: function () { mostrarFlotantes(true); },
        onLeaveBack: function () { mostrarFlotantes(false); }
      });
    }
  }

  /* ---------- marquee ---------- */

  var pista = document.querySelector(".marquee-pista");
  if (pista && !reduce) {
    gsap.to(pista, { xPercent: -50, duration: 48, ease: "none", repeat: -1 });
  }

  /* ---------- botones magnéticos ---------- */

  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetico").forEach(function (btn) {
      var qx = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
      var qy = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.3);
        qy((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      btn.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }

  /* las fuentes cambian las medidas: se recalcula todo cuando cargan */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  iniciarBasico();

  /* ---------- cosas que funcionan con o sin GSAP ---------- */

  function iniciarBasico() {
    /* cookies */
    var banner = document.querySelector(".cookie-banner");
    var CLAVE = "dyf-cookie-ack";
    var visto = false;
    try { visto = localStorage.getItem(CLAVE) === "1"; } catch (e) { visto = false; }
    if (banner && !visto) banner.hidden = false;
    if (banner) {
      banner.querySelector(".cookie-ack").addEventListener("click", function () {
        banner.hidden = true;
        try { localStorage.setItem(CLAVE, "1"); } catch (e) { /* modo privado */ }
      });
    }

    /* año del pie */
    var anio = document.querySelector("[data-anio]");
    if (anio) anio.textContent = String(new Date().getFullYear());

    /* diálogos legales */
    document.querySelectorAll("[data-dialog]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dlg = document.getElementById(btn.dataset.dialog);
        if (dlg && dlg.showModal) dlg.showModal();
      });
    });
    document.querySelectorAll("[data-cerrar]").forEach(function (btn) {
      btn.addEventListener("click", function () { btn.closest("dialog").close(); });
    });

    /* mapa por consentimiento: el iframe solo existe si lo pides */
    var mapBtn = document.querySelector("[data-map]");
    if (mapBtn) {
      mapBtn.addEventListener("click", function () {
        var caja = mapBtn.closest(".map-consent");
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.google.com/maps?q=" +
          encodeURIComponent("Dourado & Fernández Asesores SL, Rúa Fomento, 52, 15100 Carballo, A Coruña") +
          "&output=embed";
        iframe.loading = "lazy";
        iframe.title = "Mapa de la ubicación de Dourado & Fernández Asesores en Carballo";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        caja.innerHTML = "";
        caja.style.padding = "0";
        caja.style.border = "0";
        caja.appendChild(iframe);
      });
    }

    /* menú móvil */
    var menuBtn = document.querySelector(".menu-btn");
    var menu = document.getElementById("menu-movil");
    if (menuBtn && menu) {
      var abrir = function (si) {
        menu.hidden = !si;
        menuBtn.setAttribute("aria-expanded", String(si));
        menuBtn.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
        document.body.style.overflow = si ? "hidden" : "";
        if (lenis) { si ? lenis.stop() : lenis.start(); }
      };
      menuBtn.addEventListener("click", function () {
        abrir(menuBtn.getAttribute("aria-expanded") !== "true");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { abrir(false); });
      });
    }

    /* anclas con smooth scroll propio */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === "#" || a.classList.contains("skip")) return;
      a.addEventListener("click", function (e) {
        if (!document.querySelector(href)) return;
        e.preventDefault();
        irA(href);
      });
    });
  }
})();
