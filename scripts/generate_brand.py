"""Wordmark provisional de Dourado & Fernandez Asesores en SVG (trazados).

La identidad real del despacho son las letras "D&F" en acrilico espejado
montadas sobre una pared verde salvia: la "D" en dorado/laton y el "&" y la
"F" en cromo plateado. No existe logo formal mas alla de eso. Aqui se
recrea como wordmark tipografico "Dourado & Fernandez" con Fraunces (serif de
alto contraste, corte opsz 144) convertido a trazados con fontTools, para que
los SVG no dependan de la fuente. La "D" va en oro viejo, el "&" y la "F" en
plata fria y el resto en tinta (verde botella sobre crema, crema sobre verde).

PROVISIONAL: recreacion a partir de la descripcion de la pared del despacho,
pendiente de recibir un archivo de logo real del cliente.

Salida en assets/img/logo/:
  logo.svg          wordmark tinta verde (para fondo crema)
  logo-claro.svg    wordmark tinta crema (para fondo verde)
  placa.svg         la pared: rectangulo verde salvia con "D&F" oro + plata
  icon.svg          placa cuadrada con el monograma, para favicon
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

VERDE = "#2F4A3E"
SALVIA = "#5E7F6B"
CREMA = "#F5F1E6"
ORO = "#B8944F"
PLATA = "#C7CDD1"

DEFS = (
    "<defs>"
    '<linearGradient id="oro" x1="0" y1="0" x2="0.35" y2="1">'
    '<stop offset="0" stop-color="#E2C784"/><stop offset="0.48" stop-color="#B8944F"/>'
    '<stop offset="0.52" stop-color="#A47F3C"/><stop offset="1" stop-color="#D3B370"/>'
    "</linearGradient>"
    '<linearGradient id="plata" x1="0" y1="0" x2="0.35" y2="1">'
    '<stop offset="0" stop-color="#F2F4F5"/><stop offset="0.48" stop-color="#C7CDD1"/>'
    '<stop offset="0.52" stop-color="#A5ADB3"/><stop offset="1" stop-color="#E3E7EA"/>'
    "</linearGradient>"
    "</defs>"
)


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
    """Lista de (caracter, path_d, x, avance) del texto, coordenadas y-abajo."""
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
    """'Dourado & Fernández': D oro, & y F plata, resto tinta."""
    font = instance(560)
    size = 100.0
    runs, w = glyph_runs(font, "Dourado & Fernández", size, tracking=-0.4)
    cap = font["OS/2"].sCapHeight * size / font["head"].unitsPerEm
    desc = -font["hhea"].descent * size / font["head"].unitsPerEm

    def color(i, ch):
        if i == 0:
            return "url(#oro)"
        if ch == "&" or (ch == "F"):
            return "url(#plata)"
        return tinta

    body = f'<g transform="translate(0,{cap:.2f})">{paths(runs, color)}</g>'
    return body, w, cap + desc * 0.55


def svg(content, w, h, label, pad=0, bg=None):
    vb = f"{-pad} {-pad} {w + pad * 2:.2f} {h + pad * 2:.2f}"
    rect = (
        f'<rect x="{-pad}" y="{-pad}" width="{w + pad * 2:.2f}" height="{h + pad * 2:.2f}" fill="{bg}"/>'
        if bg else ""
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w + pad * 2:.0f}" '
        f'height="{h + pad * 2:.0f}" role="img" aria-label="{label}">{DEFS}{rect}{content}</svg>\n'
    )


def write(name, s):
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)
    print("wrote", os.path.relpath(p, HERE))


def monograma(side):
    """La pared: 'D&F' en acrilico sobre verde salvia, con sombra suave."""
    font = instance(600)
    size = side * 0.46
    runs, w = glyph_runs(font, "D&F", size, tracking=size * 0.02)
    cap = font["OS/2"].sCapHeight * size / font["head"].unitsPerEm
    x0 = (side - w) / 2
    y0 = (side + cap) / 2

    def color(i, ch):
        return "url(#oro)" if ch == "D" else "url(#plata)"

    def sombra(i, ch):
        return "rgba(20,36,28,0.45)"

    return (
        f'<rect width="{side:.2f}" height="{side:.2f}" fill="{SALVIA}"/>'
        f'<rect width="{side:.2f}" height="{side:.2f}" fill="url(#luz)"/>'
        f'<g transform="translate({x0 + size * 0.03:.2f},{y0 + size * 0.035:.2f})">{paths(runs, sombra)}</g>'
        f'<g transform="translate({x0:.2f},{y0:.2f})">{paths(runs, color)}</g>'
    )


LUZ = (
    '<defs><radialGradient id="luz" cx="0.25" cy="0.15" r="1.1">'
    '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>'
    '<stop offset="1" stop-color="#000000" stop-opacity="0.18"/>'
    "</radialGradient></defs>"
)


def main():
    body, w, h = wordmark(VERDE)
    write("logo.svg", svg(body, w, h, "Dourado & Fernández Asesores"))
    body_c, _, _ = wordmark(CREMA)
    write("logo-claro.svg", svg(body_c, w, h, "Dourado & Fernández Asesores"))

    # la placa: la pared verde con el monograma, proporción 3:2
    W, H = 900.0, 600.0
    font = instance(600)
    size = 250.0
    runs, mw = glyph_runs(font, "D&F", size, tracking=size * 0.02)
    cap = font["OS/2"].sCapHeight * size / font["head"].unitsPerEm
    x0, y0 = (W - mw) / 2, (H + cap) / 2
    placa = (
        f'<rect width="{W}" height="{H}" fill="{SALVIA}"/>'
        f'<rect width="{W}" height="{H}" fill="url(#luz)"/>'
        f'<g transform="translate({x0 + 7:.2f},{y0 + 8:.2f})">{paths(runs, lambda i, c: "rgba(20,36,28,0.45)")}</g>'
        f'<g transform="translate({x0:.2f},{y0:.2f})">{paths(runs, lambda i, c: "url(#oro)" if c == "D" else "url(#plata)")}</g>'
    )
    write("placa.svg", svg(LUZ + placa, W, H, "D&F, monograma de Dourado & Fernández Asesores"))

    side = 512.0
    write("icon.svg", svg(LUZ + monograma(side), side, side, "D&F"))


if __name__ == "__main__":
    main()
