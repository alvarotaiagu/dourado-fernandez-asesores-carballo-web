"""Descarga y grada la fotografia de la web de Dourado & Fernandez Asesores.

El brief pedia "fotografia generada"; en este entorno no hay herramienta de
generacion de imagen, asi que se usan fotos con licencia Pexels (uso comercial
libre, sin atribucion obligatoria) elegidas para el concepto "Balance":
despacho con madera calida, documentos y carpetas en orden, manos revisando
cifras o firmando, luz de ventana lateral, plantas discretas. Ninguna es del
despacho real de Rua Fomento.

  calculadora  Pexels #6963865  manos con documentos y calculadora, mesa de madera   (fiscal)
  carpetas     Pexels #7657377  cuadernos, sello y tijeras en orden sobre crema        (laboral)
  portatil     Pexels #8296990  mano con calculadora, portatil y documentos al sol   (contable)
  firma        Pexels #7054502  mano firmando un documento a la luz de la ventana     (societario)
  despacho     Pexels #7888656  mesa de madera con plantas y luz de ventana          (por que)
  interior     Pexels #8055485  persona trabajando junto a una ventana con plantas   (contacto)
  retrato-a    Pexels #36499768 retrato femenino en butaca, luz calida (PROVISIONAL, no es del equipo)
  retrato-b    Pexels #8428101  retrato masculino con gafas, luz calida (PROVISIONAL, no es del equipo)

Gradacion por script (no presets): balance de blancos gray-world suave,
supresion de azules/cian saturados (nada de azul corporativo), saturacion
contenida (0.66), split-toning con sombras viradas al verde botella #2F4A3E
y luces a crema papel #F5F1E6, un empujon calido a los tonos laton/madera,
curva en S suave, vineteado leve y grano fino. Salida en assets/img/photos/
a 1600 y 900 px de ancho mas un LQIP de 24 px.
"""
import io
import os
import urllib.request
import concurrent.futures
import numpy as np
from PIL import Image, ImageFilter

PHOTOS = {
    # nombre: (id, proporcion ancho/alto, anclaje vertical del recorte 0..1)
    "calculadora": ("6963865", 4 / 5, 0.5),
    "carpetas": ("7657377", 4 / 5, 0.5),
    "portatil": ("8296990", 4 / 5, 0.5),
    "firma": ("7054502", 4 / 5, 0.5),
    "despacho": ("7888656", 3 / 2, 0.55),
    "interior": ("8055485", 3 / 2, 0.5),
    "retrato-a": ("36499768", 4 / 5, 0.35),
    "retrato-b": ("8428101", 4 / 5, 0.3),
}

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "photos_src")
OUT = os.path.join(HERE, "..", "assets", "img", "photos")
os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

VERDE = np.array([0x2F, 0x4A, 0x3E]) / 255.0
CREMA = np.array([0xF5, 0xF1, 0xE6]) / 255.0
LUMA = np.array([0.299, 0.587, 0.114])


# algunas fotos nuevas de Pexels no responden a la URL corta y llevan slug
URLS = {
    "36499768": "https://images.pexels.com/photos/36499768/pexels-photo-36499768/free-photo-of-professional-woman-smiling-by-window-in-office.png?w=2000",
}


def fetch(pid, dest):
    if os.path.exists(dest):
        return
    url = URLS.get(pid, f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?w=2000")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())


def hue_sat(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.0
    return h, d / (mx + 1e-6)


def grade(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    # 1. balance de blancos gray-world suave
    mean = a.reshape(-1, 3).mean(0)
    a = np.clip(a * (mean.mean() / mean) ** 0.5, 0, 1)
    # 2. nada de azul corporativo: los azules y cianes saturados se desaturan
    h, s = hue_sat(a)
    frio = np.exp(-((h - 0.60) ** 2) / (2 * 0.09 ** 2)) * np.clip(s * 2.2, 0, 1)
    lum = a @ LUMA
    a = a * (1 - frio[..., None] * 0.7) + lum[..., None] * frio[..., None] * 0.7
    # 3. los rojos/naranjas chillones (carpetas, tazas) se apagan hacia laton
    h, s = hue_sat(a)
    rojo = np.exp(-((h - 0.02) ** 2) / (2 * 0.06 ** 2)) * np.clip(s * 1.6, 0, 1)
    laton = np.array([0xB8, 0x94, 0x4F]) / 255.0
    a = a * (1 - rojo[..., None] * 0.55) + (lum[..., None] * 0.55 + laton * 0.45) * rojo[..., None] * 0.55
    # 4. saturacion contenida
    lum = a @ LUMA
    a = lum[..., None] + (a - lum[..., None]) * 0.66
    # 5. split-toning: sombras al verde botella, luces a crema papel
    sh = np.clip(1.0 - lum, 0, 1)[..., None] ** 2.0
    hi = np.clip(lum - 0.6, 0, 1)[..., None] * 2.0
    a = a * (1 - sh * 0.22) + VERDE * sh * 0.22
    a = a * (1 - hi * 0.28) + CREMA * hi * 0.28
    # 6. curva en S suave y negros levantados hacia verde
    a = np.clip(a, 0, 1)
    a = a * a * (3 - 2 * a) * 0.55 + a * 0.45
    a = a * 0.96 + VERDE * 0.04
    # 6b. exposicion: despacho luminoso, no penumbra
    a = np.clip(a, 0, 1) ** 0.82
    a = np.clip(a * 1.04, 0, 1)
    # 7. vineteado leve
    hgt, wid = a.shape[:2]
    yy, xx = np.mgrid[0:hgt, 0:wid]
    r = np.sqrt(((xx - wid / 2) / (wid / 2)) ** 2 + ((yy - hgt / 2) / (hgt / 2)) ** 2)
    vig = 1 - np.clip(r - 0.55, 0, 1) ** 2 * 0.22
    a = a * vig[..., None]
    # 8. grano fino
    rng = np.random.default_rng(7)
    a = a + rng.normal(0, 0.011, a.shape)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def recortar(im, ratio, ancla):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    nh = int(w / ratio)
    y0 = int((h - nh) * ancla)
    return im.crop((0, y0, w, y0 + nh))


def procesar(nombre):
    pid, ratio, ancla = PHOTOS[nombre]
    src = os.path.join(SRC, f"{nombre}-{pid}.jpg")
    fetch(pid, src)
    im = Image.open(src)
    im = recortar(im, ratio, ancla)
    if im.width > 1600:
        im = im.resize((1600, int(im.height * 1600 / im.width)), Image.LANCZOS)
    im = grade(im)
    im.save(os.path.join(OUT, f"{nombre}-1600.jpg"), quality=82, optimize=True, progressive=True)
    im9 = im.resize((900, int(im.height * 900 / im.width)), Image.LANCZOS)
    im9.save(os.path.join(OUT, f"{nombre}-900.jpg"), quality=82, optimize=True, progressive=True)
    lq = im.resize((24, max(1, int(im.height * 24 / im.width))), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    lq.save(os.path.join(OUT, f"{nombre}-lqip.jpg"), quality=50)
    return nombre, im.size


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(4) as ex:
        for nombre, size in ex.map(procesar, PHOTOS):
            print(nombre, size)
