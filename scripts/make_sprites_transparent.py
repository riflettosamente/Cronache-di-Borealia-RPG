"""Rimuove fondi colorati/scuri dagli sprite raccoglibili e dalle icone items."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "game"
SKIP_SPRITES = {
    "map.jpg",
    "gameover.webp",
    "avatarpg.webp",
    "lanciodado.webp",
    "loading-logo.webp",
}


def lum(p) -> float:
    r, g, b = p[:3]
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0


def sat(p) -> float:
    r, g, b = [c / 255.0 for c in p[:3]]
    mx, mn = max(r, g, b), min(r, g, b)
    return 0.0 if mx < 1e-6 else (mx - mn) / mx


def classify(im: Image.Image) -> str:
    """'plate' = silhouette scura su piastra; 'darkbg' = icona chiara su fondo scuro."""
    w, h = im.size
    corners = [
        im.getpixel((0, 0)),
        im.getpixel((w - 1, 0)),
        im.getpixel((0, h - 1)),
        im.getpixel((w - 1, h - 1)),
    ]
    corner_lum = sum(lum(c) for c in corners) / 4
    sats = 0.0
    n = 0
    for y in range(h):
        for x in range(w):
            p = im.getpixel((x, y))
            if p[3] < 8:
                continue
            n += 1
            sats += sat(p)
    if n == 0:
        return "darkbg"
    avg_sat = sats / n
    # fondo scuro + icona chiara (non piastra grigia/colorata)
    if corner_lum < 0.22 and avg_sat < 0.15:
        return "darkbg"
    # piastra colorata O grigia chiara con silhouette scura
    return "plate"


def neighbors8(x: int, y: int, w: int, h: int):
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                yield nx, ny


def process_plate(im: Image.Image) -> Image.Image:
    """Tieni solo la silhouette scura (bassa saturazione) e i suoi highlight; scarta la piastra colorata/grigia."""
    w, h = im.size
    px = im.load()
    keep = [[False] * h for _ in range(w)]
    margin = max(2, min(w, h) // 14)

    for y in range(margin, h - margin):
        for x in range(margin, w - margin):
            p = px[x, y]
            if p[3] < 8:
                continue
            L = lum(p)
            s = sat(p)
            # silhouette nera / grigio scuro: mai colorata
            if s > 0.22:
                continue
            if L < 0.38:
                keep[x][y] = True

    # highlight / anti-alias adiacenti (sempre a bassa saturazione)
    expand = [[False] * h for _ in range(w)]
    for y in range(h):
        for x in range(w):
            if not keep[x][y]:
                continue
            for nx, ny in neighbors8(x, y, w, h):
                if keep[nx][ny] or expand[nx][ny]:
                    continue
                p = px[nx, ny]
                if p[3] < 8:
                    continue
                L = lum(p)
                s = sat(p)
                if s > 0.28:
                    continue
                if L >= 0.38:
                    expand[nx][ny] = True
                elif L < 0.5:
                    expand[nx][ny] = True

    for y in range(h):
        for x in range(w):
            if expand[x][y]:
                keep[x][y] = True

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if not keep[x][y]:
                continue
            r, g, b, a = px[x, y]
            # forza via residui colorati eventuali
            if sat((r, g, b, a)) > 0.35 and lum((r, g, b, a)) > 0.15:
                continue
            opx[x, y] = (r, g, b, a if a > 0 else 255)
    return out


def process_darkbg(im: Image.Image) -> Image.Image:
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            L = lum((r, g, b, a))
            if L < 0.28:
                continue
            if L < 0.45:
                na = int(max(0, min(255, (L - 0.28) / 0.17 * 255)))
                if na < 12:
                    continue
                opx[x, y] = (r, g, b, na)
            else:
                opx[x, y] = (r, g, b, a if a > 0 else 255)
    return out


def process_file(path: Path, backup_dir: Path) -> str:
    im = Image.open(path).convert("RGBA")
    kind = classify(im)
    out = process_plate(im) if kind == "plate" else process_darkbg(im)

    bbox = out.getbbox()
    if bbox:
        cropped = out.crop(bbox)
    else:
        cropped = out

    canvas = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ow, oh = cropped.size
    ox = (im.width - ow) // 2
    oy = (im.height - oh) // 2
    canvas.paste(cropped, (ox, oy), cropped)

    backup_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, backup_dir / path.name)
    canvas.save(path, "WEBP", lossless=True, quality=100)
    return kind


def main() -> None:
    backup = Path(__file__).resolve().parents[1] / ".sprite-backup-transparent"
    stats = {"plate": 0, "darkbg": 0}
    paths: list[Path] = []
    for folder in ("sprites", "items"):
        d = ROOT / folder
        for p in sorted(d.glob("*.webp")):
            if folder == "sprites" and p.name in SKIP_SPRITES:
                continue
            paths.append(p)

    for p in paths:
        kind = process_file(p, backup / p.parent.name)
        stats[kind] += 1
        print(f"{kind:7} {p.parent.name}/{p.name}")

    print("DONE", stats, "backup ->", backup)


if __name__ == "__main__":
    main()
