# Dourado & Fernández SLU · Carballo

Web para **Dourado & Fernández SLU**, asesoría y correduría de seguros en Rúa Barcelona, 10 1º, Carballo (A Coruña). Negocio real, sin sitio previo. **Primera plantilla del sector asesoría/gestoría** de la carpeta.

**2026-09-21 — reunión con el cliente y rebranding a la identidad real.** El cliente enseñó su tarjeta física: paleta roja (no verde), logo real (monograma "D&F" en tinta + una cinta vertical con el "&" recortado, no las letras de acrílico de la pared que se habían descrito antes) y corrigió dirección, nombre legal, teléfono móvil y los dos emails del despacho. Ver «Wordmark» y «Datos reales» abajo, ya actualizados; el resto de este documento (estructura, animaciones) sigue describiendo el sitio tal cual, solo cambió la piel.

Concepto **"Balance"**: el libro mayor como diseño. Cifras que cuadran, columnas que suman, renglones finos que separan bloques, la calma de tener el papeleo en orden. El gesto que firma toda la web es **cuadrar**: las cosas entran descuadradas y se alinean.

Sitio estático sin build: `index.html` + `css/style.css` + `js/main.js`. GSAP 3.12 + ScrollTrigger y Lenis 1.1 desde CDN; Fraunces e Inter desde Google Fonts. Sin canvas, sin shaders, sin imágenes de fondo: la retícula de papel contable es CSS.

## Paleta y tipografía

- **Rojo de marca** `#7E1E22` / oscuro `#5C1114` (estructural, tomado de la tarjeta real: tinta de la "D&F" y del fondo del anverso), **blanco puro** `#FFFFFF` (base, pedido expresamente el 2026-09-21 en vez del crema original), **gris cálido** `#D9D2C2` / `#A69C88` (separadores, texto secundario). Para el rojo **como texto** sobre blanco se usa `#7A1418` (`--oro-tinta`, ~10,4:1). Nada de azul ni gris de banco. Hasta el 2026-09-21 la paleta era verde botella/oro/plata (recreación provisional); se sustituyó entera al ver la tarjeta del cliente — los nombres de variable CSS (`--verde`, `--oro`, `--plata`, `--crema`...) se conservaron para no tocar cientos de usos, solo cambiaron los valores.
- **Fraunces** (opsz 144, SOFT 0, WONK 0) para wordmark, titulares y cifras; **Inter** para cuerpo. Las cifras clave van en serif, grandes, con `font-variant-numeric: tabular-nums` y una **regla fina debajo** que se dibuja al entrar (`.regla-cifra`, `scaleX 0 → 1`).

## El control de paleta (demostración, quitar antes de dar la web por oficial)

**Solo para mientras el cliente decide el color** — mando abajo a la izquierda (`#paleta`) que cambia en vivo entre tres paletas: **Rojo** (la real, marcada por defecto), **Azul** y **Verde**, dos alternativas derivadas conservando el mismo contraste (~7:1 en botones, ~10:1 en texto sobre blanco). Solo cambia el color de marca (`--verde`, `--salvia`, `--oro` y derivados, redefinidos bajo `html.paleta-azul`/`html.paleta-verde`); la tinta, el papel y **el logo real no cambian de color** con el mando — es deliberado, el logo es el elemento fijo de la identidad. La elección se recuerda en `localStorage` (`dyf-paleta`) y se resuelve en un script bloqueante del `<head>`, antes de pintar, para que la página no arranque en una paleta y salte a otra. Comprobado por script en `scripts/verify.js`.

### Cómo quitarlo al dar la web por oficial

**Esto hay que hacerlo siempre** (mismo criterio que cualquier otro control de demostración de la carpeta). Se borran cuatro cosas:

1. `index.html`: el bloque `<div class="paleta" id="paleta">` (marcado con comentario) y, en el `<script>` del `<head>`, el `try` que lee `dyf-paleta`.
2. `js/main.js`: la función `initPaleta()`.
3. `css/style.css`: el bloque «Control de paleta» (las reglas `.paleta*` y las dos clases `html.paleta-azul`/`html.paleta-verde`).
4. Confirmar con el cliente cuál de las tres paletas se queda como definitiva antes de borrar las otras dos.

## Estructura (propia)

1. **Portada — el libro que cuadra.** Fondo crema con renglones horizontales y cuatro columnas verticales en plata (CSS). A la izquierda, el wordmark «Dourado & Fernández» con char-reveal (D en oro, & y F en plata), la bajada, «Aquí las cuentas *cuadran*», CTA «Pedir cita» magnético y los datos reales. A la derecha, un **asiento contable de ejemplo** en tres columnas (Concepto · Debe · Haber) que entran **desplazadas y giradas** (−38 px/−1,4°, +58 px/+1,1°, −26 px/+0,8°) con interrogaciones en vez de cifras. Al cargar: las columnas se deslizan a su sitio (`power3.out`, 0,9 s), las `?` se resuelven fila a fila con unos dígitos al azar, la regla de oro se dibuja, los totales cuentan hasta **7.786,00 | 7.786,00** y aparece el sello **✓ Cuadra**. Las cifras son decorativas (un asiento que cuadra), no datos del negocio.
2. **Marquee** lento en mayúsculas con tracking: FISCAL · LABORAL · CONTABLE · SOCIEDADES · RENTA · NÓMINAS · IVA E IRPF · SEGUROS.
3. **01 / 06 — Qué hacemos.** **Sticky stack** de cuatro tarjetas (fiscal, laboral, contable, constitución de empresas): el `<li>` es el sticky y el margen inferior el recorrido; cada tarjeta entra descuadrada (34 px, 0,7°) y se corrige, y al ser tapada se encoge a 0,965. La columna fija lleva el índice `01 / 04`, una **regla cuya marca avanza** entre tarjetas y el **renglón de cifra** de la tarjeta activa (4 liquidaciones trimestrales, 12 nóminas, 1 cierre, 1 escritura). Cada tarjeta repite su renglón bajo una doble regla y lleva una foto.
4. **02 / 06 — Por qué.** Bloque de confianza en formato **balance**: columna *Debe* (lo que traes), columna *Haber* (lo que te llevas) y *Saldo* con el **4,2 ★** grande con contador y «5 reseñas en Google». Debajo, foto de ambiente y tres cifras: 2 tardes por semana, 4 áreas, y los años de actividad como hueco.
5. **03 / 06 — Calendario fiscal.** Filas de libro mayor (Mes · Trámite · Modelos · Plazo · Días) con los plazos genéricos de la AEAT para ejercicio natural; los días llevan contador. JS marca la fila **«próximo»** calculándola con el mes actual (no es un dato inventado). Todo el bloque va marcado **[CONFIRMAR FECHAS CON LA ASESORÍA]**.
6. **04 / 06 — Equipo.** Dos huecos con foto de archivo, nombre, cargo y bio pendientes.
7. **05 / 06 — Reseñas.** `4,2` gigante con contador, estrellas al 84 %, `5 reseñas`, enlace a la ficha de Google y tres reseñas con el texto como hueco marcado.
8. **06 / 06 — Contacto.** Ficha en renglones: teléfono grande, dirección, horario en tres líneas, email pendiente, Facebook, y el mapa de Google por consentimiento.
9. **Pie** en rojo de marca, el «cierre del balance»: wordmark claro (tinta plana crema), datos, `Saldo: 0,00 ✓`, diálogos legales.

**Progreso de scroll — la regla de márgenes.** Una regla vertical de plata fija en el margen derecho (`.margen`), oculta en la portada y visible al cruzar el marquee, con **una marca por sección** (01–06, generadas por `main.js` y colocadas según la posición real de cada sección en el scroll total). Un **tick de oro** baja con el scroll (suavizado con `quickTo`, 0,55 s) y, al alcanzar cada marca, su número **se cuadra**: pasa de plata y ladeado (8 px, 3°) a tinta y alineado con un pequeño rebote. La marca de la sección actual muestra su nombre; todas son botones que llevan a su sección. Sobre el pie verde la regla pasa a tinta clara. **En móvil (≤760 px) se reduce a un punto de oro** que baja por el margen con más inercia (0,9 s), sin marcas. Con reduced-motion sigue el scroll sin suavizado. Los rótulos de sección van numerados igual que la regla (`01 / 06`).

**WhatsApp flotante** abajo a la derecha (`.whatsapp`): píldora en rojo de marca con el glifo en crema, magnética, cuya etiqueta «Escríbenos por WhatsApp» se despliega al pasar el ratón o al enfocar con teclado. Enlaza a `wa.me/34671198366` (el móvil de la tarjeta, confirmado el 2026-09-21 — antes usaba el fijo sin confirmar) con un mensaje prellenado. **Es visible desde la carga de la página** (no espera a que se haga scroll) y funciona sin JavaScript, porque es el canal de contacto principal. Mientras el aviso de cookies está abierto, el botón (y la regla de progreso) se apartan hacia arriba la altura del aviso (`--cookie-h`, calculada en `main.js`) para no quedar tapados por él.

Los bloques con clase `.cuadrar` entran desplazados (28 px) y girados 0,9° hacia un lado (`data-lado`) y se corrigen con `power3.out` en 0,85 s. Reglas finas horizontales separan todo como renglones; los totales llevan doble regla.

## Datos reales usados (facilitados por el cliente, publicados tal cual)

- Nombre: **Dourado & Fernández SLU**. Marca: «asesoría · corredoría». Categoría: asesor fiscal y correduría de seguros en Carballo.
- Dirección: **Rúa Barcelona, 10 1º, 15100 Carballo, A Coruña**. Teléfono: **981 70 27 60**. Móvil/WhatsApp: **671 19 83 66**.
- Email: **asesoria@douradofernandez.com** (gestoría) y **seguros@douradofernandez.com** (corredoría) — dos buzones, de la tarjeta.
- Google: **4,2 ★ con 5 reseñas** (portada, balance, reseñas, meta description y `aggregateRating` del schema `AccountingService`).
- Horario: **L–J 9:00–14:00 y 15:00–18:00 · V 9:00–14:00 · S–D cerrado** (también en el `openingHoursSpecification`). Sin confirmar de nuevo tras la reunión — pendiente si sigue siendo así en la dirección nueva.
- Facebook: https://www.facebook.com/douradofernandez/
- Identidad: tarjeta física real entregada el 2026-09-21, ver «Wordmark».

## Pendiente (marcado en la web con `.pendiente-tag`)

- **[CONFIRMAR CON LA ASESORÍA]** — la lista entera de servicios (fiscal, laboral, contable, constitución de empresas, renta, nóminas y seguros sociales, IVA/IRPF trimestral, sociedades) son categorías genéricas del sector; ni especialidades ni software. La correduría de seguros ya está confirmada (tarjeta + email propio) pero no tiene tarjeta dedicada en «Qué hacemos» — solo mención en el marquee y en la nota.
- **[CONFIRMAR FECHAS CON LA ASESORÍA]** — el calendario fiscal completo.
- **[AÑOS DE ACTIVIDAD PENDIENTE]**, **[PRECIO PENDIENTE]** (no se publica ninguna tarifa).
- **[NOMBRE ASESOR/A PENDIENTE]** ×2, **[CARGO PENDIENTE]** ×2, **[BIO PENDIENTE]** ×2, **[FOTO PENDIENTE]** ×2, **[EQUIPO PENDIENTE]** — se muestran dos huecos por los dos apellidos del nombre comercial; el número real de personas está por confirmar.
- **[TEXTO DE RESEÑA PENDIENTE]** ×3 y **[NOMBRE PENDIENTE]** ×3 — no se transcribe ninguna reseña hasta recibir capturas o el enlace. La nota y el número sí son reales.
- **[NIF PENDIENTE]**, **[DATOS REGISTRALES PENDIENTES]**, **[POLÍTICA COMPLETA PENDIENTE]**.
- **Botón «Sitio web» de la ficha de Google**: no se facilitó la URL, así que no se ha consultado ni se enlaza. Si existe una web activa, conviene revisarla solo como fuente de datos.
- Premios: no se menciona ninguno. Sistema de cita online: no existe; el CTA llama por teléfono.
- Resueltos el 2026-09-21 (ya no están marcados): email, WhatsApp (era el fijo sin confirmar, ahora el móvil de la tarjeta), logo (ya no es «provisional»), dirección y nombre legal (estaban mal).

## Wordmark

**Logo real, recibido el 2026-09-21** en la tarjeta física del cliente (ya no es la recreación provisional de las letras de acrílico sobre la pared verde, que resultó no coincidir ni en color ni en forma). El monograma es «D&F»: una D y una F de palo grueso, y entre ambas una cinta vertical de bordes cóncavos (más ancha arriba y abajo, como un lazo o banderola) que aloja el «&» recortado en el color de fondo — la misma tinta cubre D, cinta y F, y solo el ampersand cambia de color. `scripts/generate_brand.py` lo reconstruye a mano (no es un trazado literal de la foto: coordenadas propias para el monograma, y el glifo "&" de **Fraunces** vía fontTools para el recorte) junto con el wordmark **«dourado & fernández»** en minúsculas y la marquilla **«ASESORÍA · CORREDORÍA»**, ambos también convertidos a trazados. Sin degradados metalizados (los oro/plata de antes no existen en la tarjeta real): tinta plana, con dos variantes de color intercambiables igual que las dos caras de la tarjeta.

Salida en `assets/img/logo/`: `logo.svg` (monograma + wordmark, tinta roja sobre crema), `logo-claro.svg` (crema sobre rojo oscuro, para fondos de marca), `placa.svg` (monograma solo, crema sobre rojo, para compartir), `icon.svg` + PNG 96/180/192/512 (monograma sobre cuadrado rojo, favicon) y `og.png` (`scripts/generate_icons.js`, rasterizado con Playwright). En la cabecera, el monograma va como `<img>` del `icon.svg` junto al wordmark de texto real (con la webfont, para conservar el char-reveal del hero); ese wordmark de texto ya no lleva coloreado especial por letra (antes D oro / &F plata), es tinta plana (`.wm-oro`/`.wm-plata` se dejaron como clases sin efecto, `color: currentColor`, para no tocar el marcado del reveal en tres sitios).

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

`scripts/verify.js` (68 pruebas, informe en `scripts/verify-report.json`, capturas en `screenshots/`): columnas descuadradas a mitad de intro y alineadas al final, cifras resueltas, totales 7.786,00, regla y sello; char-reveal completo del wordmark; cookies (aparece, cierra de verdad, se recuerda); longtasks; todos los `.cuadrar` a 0°; sticky stack (índice, regla, tarjeta activa visible y encima, tarjetas tapadas encogidas, renglón cambiando); contadores de balance, calendario y reseñas; fila «próximo»; mapa solo al pulsar y sin API key; diálogos; reduced-motion; sin JS; sin scroll horizontal a 1440/1024/768/400/360; menú móvil; regla de márgenes (oculta en portada, 6 marcas, tick a mitad y al 100 %, marcas cuadradas y alineadas, marca actual, pulsar una marca lleva a su sección, tinta clara sobre el pie, punto sin marcas a 400 px sin solapar el WhatsApp) y WhatsApp (enlace, etiqueta desplegable).

Dos bugs reales los cazó esta verificación antes de darla por buena: la **D, & y F del hero no se pintaban** (el degradado `background-clip: text` del contenedor no llega a los spans transformados del char-reveal; ahora va en cada letra) y la **tarjeta 03 del stack quedaba invisible** (un scrub sobre la opacidad arrancaba en 0 y pisaba la animación de entrada; el scrub ahora solo escala).
