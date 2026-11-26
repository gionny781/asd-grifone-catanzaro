#!/usr/bin/env python3
"""Aggiunge lo stemma del Grifone (e la scritta ©) alle foto della Fotogallery.
Lo lancia da solo GitHub (vedi .github/workflows/watermark.yml) ogni volta che carichi foto dal pannello.
Ogni foto viene marchiata una sola volta: l'elenco delle foto già fatte sta in data/.watermark.json."""
import hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
REG = ROOT / "data" / ".watermark.json"
LOGO = Image.open(ROOT / "images" / "logo.png").convert("RGBA")
MAX_LATO = 2400          # le foto più grandi vengono ridotte (più leggere da caricare)
TESTO = "© A.S.D. Grifone Catanzaro"

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if Path(f).exists(): return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def marchia(path: Path):
    im = ImageOps.exif_transpose(Image.open(path))
    fmt = (Image.open(path).format or "JPEG").upper()
    im.thumbnail((MAX_LATO, MAX_LATO))
    base = im.convert("RGBA")
    w, h = base.size
    lato = max(60, int(min(w, h) * 0.16))                     # stemma ~16% del lato corto
    logo = LOGO.copy(); logo.thumbnail((lato, lato))
    a = logo.getchannel("A").point(lambda v: int(v * 0.85)); logo.putalpha(a)
    m = max(12, int(min(w, h) * 0.03))
    over = Image.new("RGBA", base.size, (0, 0, 0, 0))
    over.alpha_composite(logo, (w - logo.width - m, h - logo.height - m))
    d = ImageDraw.Draw(over)
    f = font(max(12, int(min(w, h) * 0.028)))
    tw = d.textlength(TESTO, font=f)
    x, y = w - logo.width - m * 2 - tw, h - m - f.size - 4
    if x > m:
        d.text((x + 2, y + 2), TESTO, font=f, fill=(0, 0, 0, 140))
        d.text((x, y), TESTO, font=f, fill=(255, 255, 255, 220))
    out = Image.alpha_composite(base, over)
    if fmt in ("JPEG", "JPG", "MPO"):
        out.convert("RGB").save(path, "JPEG", quality=88, optimize=True, progressive=True)
    elif fmt == "WEBP":
        out.save(path, "WEBP", quality=88)
    else:
        out.save(path, fmt)

def main():
    reg = json.loads(REG.read_text()) if REG.exists() else []
    gallery = json.loads((ROOT / "data" / "gallery.json").read_text() or "[]")
    fatte = 0
    percorsi = []
    for item in gallery if isinstance(gallery, list) else []:
        f = (item or {}).get("foto") or []
        percorsi += f if isinstance(f, list) else [f]
    for p in percorsi:
        p = str(p or "").lstrip("/")
        if not p: continue
        path = ROOT / p
        if not path.is_file() or path.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"): continue
        if sha(path) in reg: continue
        marchia(path)
        reg.append(sha(path)); fatte += 1
        print("marchiata:", p)
    REG.write_text(json.dumps(reg, indent=0) + "\n")
    print(f"foto marchiate: {fatte}")

if __name__ == "__main__":
    main()
