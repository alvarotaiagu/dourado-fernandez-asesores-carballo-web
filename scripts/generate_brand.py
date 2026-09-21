"""Logo real de Dourado & Fernández, en SVG (trazados).

Identidad recibida el 2026-09-21 en la tarjeta física del cliente (reunión
en el despacho): monograma "D&F" en tinta roja sobre papel crema — la D y
la F son letras de palo grueso, y entre ambas hay una cinta/banderola
vertical (bordes curvos, más ancha arriba y abajo) que aloja el "&"
recortado en el color de fondo. Dos variantes de color intercambiables,
igual que la tarjeta trae una versión tinta-sobre-papel y otra invertida
papel-sobre-tinta. Recreado a mano a partir de fotos de la tarjeta
(scripts auxiliares de muestreo de color en el historial de la sesión),
no es un trazado literal de la foto.

Salida en assets/img/logo/:
  logo.svg          monograma + wordmark, tinta roja sobre crema
  logo-claro.svg     monograma + wordmark, crema sobre tinta roja
  placa.svg          monograma solo, papel-sobre-rojo, para OG/redes
  icon.svg           monograma solo, cuadrado, para favicon (fondo rojo)
  (los PNG y og.png los rasteriza scripts/generate_icons.js)

Uso: python scripts/generate_brand.py   (descarga Fraunces variable a %TEMP%/fonts)
"""
import os
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "img", "logo")
os.makedirs(OUT, exist_ok=True)

FONT_DIR = os.path.join(os.environ.get("TEMP", "/tmp"), "fonts")
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
FONT_PATH = os.path.join(FONT_DIR, "Fraunces[SOFT,WONK,opsz,wght].ttf")

ROJO = "#7E1E22"
ROJO_OSCURO = "#5C1114"
CREMA = "#FFFFFF"
TINTA = "#2A2622"


def mix(hex_a, hex_b, pct_a):
    """Mezcla plana de dos colores hex (sin transparencia), pct_a en [0,1].
    Valor estático, no color-mix() CSS: algunos rasterizadores (librsvg,
    lectores de OG de redes sociales) no lo resuelven y caen a negro."""
    a = tuple(int(hex_a[i:i+2], 16) for i in (1, 3, 5))
    b = tuple(int(hex_b[i:i+2], 16) for i in (1, 3, 5))
    rgb = tuple(round(a[i] * pct_a + b[i] * (1 - pct_a)) for i in range(3))
    return "#{:02X}{:02X}{:02X}".format(*rgb)


TAG_SOBRE_CREMA = mix(TINTA, CREMA, 0.62)
TAG_SOBRE_ROJO = mix(CREMA, ROJO_OSCURO, 0.72)


def ensure_font():
    os.makedirs(FONT_DIR, exist_ok=True)
    if not os.path.exists(FONT_PATH):
        req = urllib.request.Request(FONT_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=180) as r, open(FONT_PATH, "wb") as f:
            f.write(r.read())
    return FONT_PATH


_cache = {}


def instance(wght, opsz=144):
    key = (wght, opsz)
    if key not in _cache:
        f = TTFont(ensure_font())
        _cache[key] = instantiateVariableFont(
            f, {"wght": wght, "opsz": opsz, "SOFT": 0, "WONK": 0}, inplace=True
        )
    return _cache[key]


def glyph_runs(font, text, size, tracking=0.0):
    upem = font["head"].unitsPerEm
    scale = size / upem
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    kern = {}
    if "GPOS" not in font and "kern" in font:
        kern = font["kern"].kernTables[0].kernTable
    runs = []
    x = 0.0
    prev = None
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            x += size * 0.3 + tracking
            prev = None
            continue
        if prev and (prev, gname) in kern:
            x += kern[(prev, gname)] * scale
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        runs.append((ch, pen.getCommands(), x, scale))
        x += hmtx[gname][0] * scale + tracking
        prev = gname
    return runs, max(0.0, x - tracking)


def glyph_path(font, ch, size):
    """Un solo glifo como <path>, con su ancho."""
    runs, w = glyph_runs(font, ch, size)
    if not runs:
        return "", 0.0
    _, d, x, scale = runs[0]
    return d, w


def paths(runs, color_for):
    out = []
    for i, (ch, d, x, scale) in enumerate(runs):
        if not d:
            continue
        out.append(
            f'<path fill="{color_for(i, ch)}" transform="translate({x:.2f},0) '
            f'scale({scale:.6f},{-scale:.6f})" d="{d}"/>'
        )
    return "".join(out)


def wordmark(tinta):
    """'dourado & fernández': una sola tinta, minúsculas como en la tarjeta real."""
    font = instance(480)
    size = 100.0
    runs, w = glyph_runs(font, "dourado & fernández", size, tracking=-0.2)
    cap = font["OS/2"].sTypoAscender * size / font["head"].unitsPerEm
    desc = -font["hhea"].descent * size / font["head"].unitsPerEm
    body = f'<g transform="translate(0,{cap:.2f})">{paths(runs, lambda i, c: tinta)}</g>'
    return body, w, cap + desc * 0.55


def tagline(color):
    """'asesoría · corredoría', versalitas espaciadas, como en la tarjeta."""
    font = instance(560)
    size = 38.0
    runs, w = glyph_runs(font, "ASESORÍA · CORREDORÍA", size, tracking=size * 0.12)
    cap = font["OS/2"].sCapHeight * size / font["head"].unitsPerEm
    body = f'<g transform="translate(0,{cap:.2f})">{paths(runs, lambda i, c: color)}</g>'
    return body, w, cap


def monograma(fondo, tinta_letras, tinta_cinta, color_amp, escala=1.0):
    """El monograma D&F: D y F de palo grueso + cinta vertical con '&' recortado.

    Coordenadas en un sistema de H=100 (altura de caja), ancho total ~226.
    fondo: rect de fondo (None = sin fondo, transparente).
    tinta_letras / tinta_cinta: normalmente el mismo color (letras y cinta
    hacen un solo bloque de tinta); color_amp es el hueco recortado.
    """
    H = 100.0
    parts = []
    if fondo:
        parts.append(f'<rect x="-14" y="-14" width="{226*escala+28:.1f}" height="{H*escala+28:.1f}" fill="{fondo}"/>')

    def s(v):
        return v * escala

    # D: astil izquierdo + panza muy redondeada (letra de palo grueso, como en la tarjeta)
    d_path = (
        f"M{s(0)},{s(0)} L{s(15)},{s(0)} "
        f"C{s(42)},{s(0)} {s(60)},{s(18)} {s(60)},{s(50)} "
        f"C{s(60)},{s(82)} {s(42)},{s(100)} {s(15)},{s(100)} "
        f"L{s(0)},{s(100)} Z "
        f"M{s(15)},{s(16)} L{s(15)},{s(84)} "
        f"C{s(35)},{s(84)} {s(45)},{s(70)} {s(45)},{s(50)} "
        f"C{s(45)},{s(30)} {s(35)},{s(16)} {s(15)},{s(16)} Z"
    )
    parts.append(f'<path fill="{tinta_letras}" fill-rule="evenodd" d="{d_path}"/>')

    # Cinta/banderola: vertical, bordes cóncavos que se abren en abanico
    # arriba y abajo (como el recorte de la tarjeta), con el '&' dentro.
    x_cinta = s(70)
    cx0, cy0 = s(70) - 0, s(0)
    cinta_d = (
        f"M{s(62)},{s(0)} L{s(146)},{s(0)} "
        f"C{s(134)},{s(16)} {s(128)},{s(34)} {s(128)},{s(50)} "
        f"C{s(128)},{s(66)} {s(134)},{s(84)} {s(146)},{s(100)} "
        f"L{s(62)},{s(100)} "
        f"C{s(74)},{s(84)} {s(80)},{s(66)} {s(80)},{s(50)} "
        f"C{s(80)},{s(34)} {s(74)},{s(16)} {s(62)},{s(0)} Z"
    )
    parts.append(f'<path fill="{tinta_cinta}" d="{cinta_d}"/>')

    font = instance(560)
    amp_d, amp_w = glyph_path(font, "&", s(58))
    cap = font["OS/2"].sCapHeight * s(58) / font["head"].unitsPerEm
    ax = s(104) - amp_w / 2
    ay = s(50) + cap / 2
    parts.append(
        f'<g transform="translate({ax:.2f},{ay:.2f}) scale({s(58)/font["head"].unitsPerEm:.6f},{-s(58)/font["head"].unitsPerEm:.6f})">'
        f'<path fill="{color_amp}" d="{amp_d}"/></g>'
    )

    # F: astil + brazo superior + brazo medio (palo grueso, como en la tarjeta)
    fx = s(162)
    f_d = (
        f"M{fx:.2f},{s(0)} L{fx+s(60):.2f},{s(0)} L{fx+s(60):.2f},{s(20)} L{fx+s(18):.2f},{s(20)} "
        f"L{fx+s(18):.2f},{s(42)} L{fx+s(50):.2f},{s(42)} L{fx+s(50):.2f},{s(60)} L{fx+s(18):.2f},{s(60)} "
        f"L{fx+s(18):.2f},{s(100)} L{fx:.2f},{s(100)} Z"
    )
    parts.append(f'<path fill="{tinta_letras}" d="{f_d}"/>')

    return "".join(parts), s(226), s(H)


def svg(content, w, h, label, pad=0):
    vb = f"{-pad} {-pad} {w + pad * 2:.2f} {h + pad * 2:.2f}"
    label = label.replace("&", "&amp;")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w + pad * 2:.0f}" '
        f'height="{h + pad * 2:.0f}" role="img" aria-label="{label}">{content}</svg>\n'
    )


def write(name, s):
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)
    print("wrote", os.path.relpath(p, HERE))


def main():
    # Monograma solo + wordmark + tagline, combinados en horizontal.
    mono_d, mono_w, mono_h = monograma(None, ROJO, ROJO, CREMA)
    wm_body, wm_w, wm_h = wordmark(TINTA)
    tag_body, tag_w, tag_h = tagline(TAG_SOBRE_CREMA)

    gap = mono_h * 0.22
    wm_altura, tag_altura, entrelinea = mono_h * 0.40, mono_h * 0.15, mono_h * 0.06
    escala_wm = wm_altura / wm_h
    escala_tag = tag_altura / tag_h
    x_text = mono_w + gap
    y_wm = (mono_h - (wm_altura + entrelinea + tag_altura)) / 2
    y_tag = y_wm + wm_altura + entrelinea

    combo = (
        f'<g>{mono_d}</g>'
        f'<g transform="translate({x_text:.2f},{y_wm:.2f}) scale({escala_wm:.4f})">{wm_body}</g>'
        f'<g transform="translate({x_text:.2f},{y_tag:.2f}) scale({escala_tag:.4f})">{tag_body}</g>'
    )
    total_w = x_text + max(wm_w * escala_wm, tag_w * escala_tag)
    write("logo.svg", svg(combo, total_w, mono_h, "Dourado & Fernández, Asesoría · Corredoría", pad=6))

    # Versión clara (para fondo rojo/tinta): monograma crema sobre rojo, texto crema.
    mono_c, _, _ = monograma(None, CREMA, CREMA, ROJO_OSCURO)
    wm_c, _, _ = wordmark(CREMA)
    tag_c, _, _ = tagline(TAG_SOBRE_ROJO)
    combo_c = (
        f'<g>{mono_c}</g>'
        f'<g transform="translate({x_text:.2f},{y_wm:.2f}) scale({escala_wm:.4f})">{wm_c}</g>'
        f'<g transform="translate({x_text:.2f},{y_tag:.2f}) scale({escala_tag:.4f})">{tag_c}</g>'
    )
    write("logo-claro.svg", svg(combo_c, total_w, mono_h, "Dourado & Fernández, Asesoría · Corredoría", pad=6))

    # Placa: solo el monograma, papel-sobre-rojo, cuadrada-ish, para OG.
    placa_d, placa_w, placa_h = monograma(ROJO, CREMA, CREMA, ROJO)
    write("placa.svg", svg(placa_d, placa_w, placa_h, "D&F, monograma de Dourado & Fernández", pad=14))

    # Icon: el monograma solo en cuadrado, fondo rojo, para favicon.
    icon_mono, icon_w, icon_h = monograma(None, CREMA, CREMA, ROJO)
    side = 320.0
    escala_icon = (side * 0.72) / icon_w
    ix = (side - icon_w * escala_icon) / 2
    iy = (side - icon_h * escala_icon) / 2
    icon_content = (
        f'<rect width="{side}" height="{side}" fill="{ROJO}"/>'
        f'<rect width="{side}" height="{side}" fill="url(#luz)"/>'
        f'<g transform="translate({ix:.2f},{iy:.2f}) scale({escala_icon:.4f})">{icon_mono}</g>'
    )
    luz = (
        '<defs><radialGradient id="luz" cx="0.3" cy="0.2" r="1.1">'
        '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.10"/>'
        '<stop offset="1" stop-color="#000000" stop-opacity="0.16"/>'
        "</radialGradient></defs>"
    )
    write("icon.svg", svg(luz + icon_content, side, side, "D&F"))


if __name__ == "__main__":
    main()
