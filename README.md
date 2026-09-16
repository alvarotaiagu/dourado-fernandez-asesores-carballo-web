# Dourado & Fernández Asesores SL · Carballo

Web para **Dourado & Fernández Asesores SL**, asesoría fiscal en Rúa Fomento, 52, Carballo (A Coruña). Negocio real, sin sitio previo. **Primera plantilla del sector asesoría/gestoría** de la carpeta.

Concepto **"Balance"**: el libro mayor como diseño. Cifras que cuadran, columnas que suman, renglones finos que separan bloques, la calma de tener el papeleo en orden. El gesto que firma toda la web es **cuadrar**: las cosas entran descuadradas y se alinean.

Sitio estático sin build: `index.html` + `css/style.css` + `js/main.js`. GSAP 3.12 + ScrollTrigger y Lenis 1.1 desde CDN; Fraunces e Inter desde Google Fonts. Sin canvas, sin shaders, sin imágenes de fondo: la retícula de papel contable es CSS.

## Paleta y tipografía

- **Verde botella** `#2F4A3E` (estructural, cercano al verde de la pared del despacho), **crema papel** `#F5F1E6` (base), **oro viejo** `#B8944F` (CTA, reglas, sello; el color real de la "D"), **plata fría** `#C7CDD1` (separadores; el cromo del "&F"). Para el oro **como texto** sobre crema se usa `#86672A` (`--oro-tinta`), porque `#B8944F` sobre crema da 2,3:1 y no pasa ni para texto grande. Nada de azul ni gris de banco.
- **Fraunces** (opsz 144, SOFT 0, WONK 0) para wordmark, titulares y cifras; **Inter** para cuerpo. Las cifras clave van en serif, grandes, con `font-variant-numeric: tabular-nums` y una **regla fina debajo** que se dibuja al entrar (`.regla-cifra`, `scaleX 0 → 1`).

## Estructura (propia)

1. **Portada — el libro que cuadra.** Fondo crema con renglones horizontales y cuatro columnas verticales en plata (CSS). A la izquierda, el wordmark «Dourado & Fernández» con char-reveal (D en oro, & y F en plata), la bajada, «Aquí las cuentas *cuadran*», CTA «Pedir cita» magnético y los datos reales. A la derecha, un **asiento contable de ejemplo** en tres columnas (Concepto · Debe · Haber) que entran **desplazadas y giradas** (−38 px/−1,4°, +58 px/+1,1°, −26 px/+0,8°) con interrogaciones en vez de cifras. Al cargar: las columnas se deslizan a su sitio (`power3.out`, 0,9 s), las `?` se resuelven fila a fila con unos dígitos al azar, la regla de oro se dibuja, los totales cuentan hasta **7.786,00 | 7.786,00** y aparece el sello **✓ Cuadra**. Las cifras son decorativas (un asiento que cuadra), no datos del negocio.
2. **Marquee** lento en mayúsculas con tracking: FISCAL · LABORAL · CONTABLE · SOCIEDADES · RENTA · NÓMINAS · IVA E IRPF.
3. **Asiento 01 — Qué hacemos.** **Sticky stack** de cuatro tarjetas (fiscal, laboral, contable, constitución de empresas): el `<li>` es el sticky y el margen inferior el recorrido; cada tarjeta entra descuadrada (34 px, 0,7°) y se corrige, y al ser tapada se encoge a 0,965. La columna fija lleva el índice `01 / 04`, una **regla cuya marca avanza** entre tarjetas y el **renglón de cifra** de la tarjeta activa (4 liquidaciones trimestrales, 12 nóminas, 1 cierre, 1 escritura). Cada tarjeta repite su renglón bajo una doble regla y lleva una foto.
4. **Asiento 02 — Por qué.** Bloque de confianza en formato **balance**: columna *Debe* (lo que traes), columna *Haber* (lo que te llevas) y *Saldo* con el **4,2 ★** grande con contador y «5 reseñas en Google». Debajo, foto de ambiente y tres cifras: 2 tardes por semana, 4 áreas, y los años de actividad como hueco.
5. **Asiento 03 — Calendario fiscal.** Filas de libro mayor (Mes · Trámite · Modelos · Plazo · Días) con los plazos genéricos de la AEAT para ejercicio natural; los días llevan contador. JS marca la fila **«próximo»** calculándola con el mes actual (no es un dato inventado). Todo el bloque va marcado **[CONFIRMAR FECHAS CON LA ASESORÍA]**.
6. **Asiento 04 — Equipo.** Dos huecos con foto de archivo, nombre, cargo y bio pendientes.
7. **Asiento 05 — Reseñas.** `4,2` gigante con contador, estrellas al 84 %, `5 reseñas`, enlace a la ficha de Google y tres reseñas con el texto como hueco marcado.
8. **Asiento 06 — Contacto.** Ficha en renglones: teléfono grande, dirección, horario en tres líneas, email pendiente, Facebook, y el mapa de Google por consentimiento.
9. **Pie** en verde botella, el «cierre del balance»: wordmark claro (D oro, &F plata), datos, `Saldo: 0,00 ✓`, diálogos legales.

Los bloques con clase `.cuadrar` entran desplazados (28 px) y girados 0,9° hacia un lado (`data-lado`) y se corrigen con `power3.out` en 0,85 s. Reglas finas horizontales separan todo como renglones; los totales llevan doble regla.

## Datos reales usados (facilitados por el cliente, publicados tal cual)

- Nombre: **Dourado & Fernández Asesores SL**. Categoría: asesor fiscal en Carballo.
- Dirección: **Rúa Fomento, 52, 15100 Carballo, A Coruña**. Teléfono: **981 70 27 60**.
- Google: **4,2 ★ con 5 reseñas** (portada, balance, reseñas, meta description y `aggregateRating` del schema `AccountingService`).
- Horario: **L–J 9:00–14:00 y 15:00–18:00 · V 9:00–14:00 · S–D cerrado** (también en el `openingHoursSpecification`).
- Facebook: https://www.facebook.com/douradofernandez/
- Identidad: las letras «D&F» en acrílico espejado sobre pared verde salvia (D dorada, &F cromo plateado).

## Pendiente (marcado en la web con `.pendiente-tag`)

- **[CONFIRMAR CON LA ASESORÍA]** — la lista entera de servicios (fiscal, laboral, contable, constitución de empresas, renta, nóminas y seguros sociales, IVA/IRPF trimestral, sociedades) son categorías genéricas del sector; ni especialidades ni software.
- **[CONFIRMAR FECHAS CON LA ASESORÍA]** — el calendario fiscal completo.
- **[AÑOS DE ACTIVIDAD PENDIENTE]**, **[EMAIL PENDIENTE]**, **[PRECIO PENDIENTE]** (no se publica ninguna tarifa).
- **[NOMBRE ASESOR/A PENDIENTE]** ×2, **[CARGO PENDIENTE]** ×2, **[BIO PENDIENTE]** ×2, **[FOTO PENDIENTE]** ×2, **[EQUIPO PENDIENTE]** — se muestran dos huecos por los dos apellidos del nombre comercial; el número real de personas está por confirmar.
- **[TEXTO DE RESEÑA PENDIENTE]** ×3 y **[NOMBRE PENDIENTE]** ×3 — no se transcribe ninguna reseña hasta recibir capturas o el enlace. La nota y el número sí son reales.
- **[NIF PENDIENTE]**, **[DATOS REGISTRALES PENDIENTES]**, **[POLÍTICA COMPLETA PENDIENTE]**.
- **[LOGO PROVISIONAL]** — ver abajo.
- **Botón «Sitio web» de la ficha de Google**: no se facilitó la URL, así que no se ha consultado ni se enlaza. Si existe una web activa, conviene revisarla solo como fuente de datos.
- Premios: no se menciona ninguno. Sistema de cita online: no existe; el CTA llama por teléfono.

## Wordmark

No hay logo formal: la identidad son las letras «D&F» de la pared. `scripts/generate_brand.py` recrea el wordmark **«Dourado & Fernández»** con **Fraunces** (wght 560, opsz 144) convertido a **trazados** con fontTools, con la **D en degradado oro** y el **& y la F en degradado plata** (dos degradados con un corte en el 50 % que imitan el acrílico espejado). Salida en `assets/img/logo/`: `logo.svg` (tinta verde, para crema), `logo-claro.svg` (tinta crema, para verde), `placa.svg` (la pared verde salvia con «D&F»), `icon.svg` + PNG 96/180/192/512 y `og.png` (`scripts/generate_icons.js`, rasterizado con Playwright). En la página el wordmark va como texto real con la webfont, para el char-reveal; el degradado va en cada letra porque `background-clip: text` no atraviesa los spans transformados del reveal.

**Es una recreación tipográfica a partir de la descripción de la pared y está marcada como provisional en el pie hasta recibir un archivo de logo real.**

## Fotografía

El brief pedía fotografía generada; en este entorno no hay herramienta de generación de imagen, así que se usan fotos con licencia **Pexels** (uso comercial libre) elegidas de hojas de contacto para el concepto: madera cálida, documentos y cuadernos en orden, manos revisando cifras o firmando, luz de ventana, plantas. **Ninguna es del despacho real** y la web lo dice en los pies de foto. Se descartaron los apretones de manos y las gráficas de crecimiento.

| Archivo | Pexels | Uso |
|---|---|---|
| `calculadora` | #6963865 | tarjeta fiscal (manos, documentos y calculadora) |
| `carpetas` | #7657377 | tarjeta laboral (cuadernos y sello sobre crema) |
| `portatil` | #8296990 | tarjeta contable (mano con calculadora y portátil al sol) |
| `firma` | #7054502 | tarjeta societaria (mano firmando a contraluz) |
| `despacho` | #7888656 | por qué (mesa de madera con plantas y ventana) |
| `interior` | #8055485 | contacto (persona trabajando junto a una ventana con plantas) |
| `retrato-a` | #36499768 | equipo, provisional (no es del equipo) |
| `retrato-b` | #8428101 | equipo, provisional (no es del equipo) |

`scripts/process_photos.py` las descarga, recorta (4:5 tarjetas y retratos, 3:2 el resto) y grada por script: balance de blancos, supresión de azules/cianes saturados, rojos apagados hacia latón, saturación 0,66, sombras viradas a verde botella y luces a crema, curva en S, exposición subida (gamma 0,82) para que el despacho sea luminoso, viñeteado leve y grano fino. Salida a 1600 y 900 px más LQIP.

## Accesibilidad y rendimiento

- `prefers-reduced-motion`: sin Lenis; las columnas del hero aparecen **ya cuadradas**, las cifras resueltas, el total sumado y el sello puesto; los bloques ya en su sitio, las reglas dibujadas, el marquee quieto y los contadores en su valor.
- Sin JS: `html.no-js` deja todo visible, no hay aviso de cookies ni iframe. Si GSAP no carga, la clase `.gsap` nunca se añade y nada queda oculto.
- Titulares con char-reveal conservan el texto en `aria-label`; los trozos van `aria-hidden`. El libro del hero es `role="img"` con descripción.
- Sin canvas y sin filtros por frame: solo transforms y opacidad. Verificado con `PerformanceObserver` (longtask): 0 tareas >50 ms en la intro y en el scroll.
- Cookies: solo `localStorage` (`dyf-cookie-ack`). `.cookie-banner[hidden] { display: none }` va **después** del `display:flex` para que el botón cierre de verdad.
- Mapa de Google insertado **únicamente al pulsar** (`.map-consent`, `google.com/maps?q=…&output=embed`, sin API key), coherente con el aviso «sin cookies de terceros».
- Responsive hasta 360 px: a ≤1000 px el hero apila texto y libro; a ≤480 px el libro mantiene sus tres columnas más estrechas sin recortar cifras (comprobado con `scrollWidth`).

## Verificación

```
python -m http.server 8952
NODE_PATH=<node_modules con playwright> node scripts/verify.js
```

`scripts/verify.js` (56 pruebas, informe en `scripts/verify-report.json`, capturas en `screenshots/`): columnas descuadradas a mitad de intro y alineadas al final, cifras resueltas, totales 7.786,00, regla y sello; degradados oro/plata en las letras del wordmark; cookies (aparece, cierra de verdad, se recuerda); longtasks; todos los `.cuadrar` a 0°; sticky stack (índice, regla, tarjeta activa visible y encima, tarjetas tapadas encogidas, renglón cambiando); contadores de balance, calendario y reseñas; fila «próximo»; mapa solo al pulsar y sin API key; diálogos; reduced-motion; sin JS; sin scroll horizontal a 1440/1024/768/400/360; menú móvil.

Dos bugs reales los cazó esta verificación antes de darla por buena: la **D, & y F del hero no se pintaban** (el degradado `background-clip: text` del contenedor no llega a los spans transformados del char-reveal; ahora va en cada letra) y la **tarjeta 03 del stack quedaba invisible** (un scrub sobre la opacidad arrancaba en 0 y pisaba la animación de entrada; el scrub ahora solo escala).
