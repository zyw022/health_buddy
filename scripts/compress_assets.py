"""
Compress all PNG/JPG images in assetstore/ in-place.
Run: python scripts/compress_assets.py
"""
import sys
import io
# force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from pathlib import Path
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT        = Path(__file__).parent.parent / "assetstore"
MAX_BG_W    = 1920
MAX_HOUSE_W = 1920

def kb(path):
    return path.stat().st_size / 1024

def quantize_rgba(img, colors=256):
    """Palette-reduce an RGBA image using OCTREE (compatible with RGBA)."""
    rgba = img.convert("RGBA")
    q = rgba.quantize(colors=colors, method=Image.Quantize.FASTOCTREE,
                      dither=Image.Dither.FLOYDSTEINBERG)
    return q.convert("RGBA")

def save_png(img, path):
    img.save(path, format="PNG", optimize=True, compress_level=9)

def save_jpg(img, path, quality=82):
    img.convert("RGB").save(path, format="JPEG", quality=quality,
                            optimize=True, progressive=True)

def process(path):
    before = kb(path)
    try:
        img = Image.open(path)
        img.load()
        rel  = path.relative_to(ROOT)
        cats = rel.parts
        ext  = path.suffix.lower()

        if cats[0] == "pets":
            out = quantize_rgba(img, colors=256)
            save_png(out, path)

        elif cats[0] == "materials" and len(cats) > 1 and cats[1] == "background":
            w, h = img.size
            if w > MAX_BG_W:
                img = img.resize((MAX_BG_W, int(h * MAX_BG_W / w)), Image.LANCZOS)
            save_png(img, path)

        elif cats[0] == "materials" and len(cats) > 1 and cats[1] == "treehouse":
            w, h = img.size
            if w > MAX_HOUSE_W:
                img = img.resize((MAX_HOUSE_W, int(h * MAX_HOUSE_W / w)), Image.LANCZOS)
            save_png(img, path)

        elif cats[0] == "materials" and len(cats) > 1 and cats[1] == "furniture":
            out = quantize_rgba(img, colors=128)
            save_png(out, path)

        elif ext in (".jpg", ".jpeg"):
            save_jpg(img, path)

        else:
            save_png(img, path)

        after = kb(path)
        pct   = (before - after) / before * 100 if before > 0 else 0
        status = "OK " if pct >= 0 else "?? "
        print(f"  {status} {str(rel):<62s}  {before:>8.1f} -> {after:>8.1f} KB  (-{pct:.0f}%)")

    except Exception as exc:
        print(f"  ERR {str(path.relative_to(ROOT)):<62s}  {exc}", file=sys.stderr)

def main():
    images = (sorted(ROOT.rglob("*.png"))
            + sorted(ROOT.rglob("*.jpg"))
            + sorted(ROOT.rglob("*.jpeg")))
    total_before = sum(kb(p) for p in images)
    print(f"Found {len(images)} images, total {total_before/1024:.1f} MB\n")
    for img_path in images:
        process(img_path)
    total_after = sum(kb(p) for p in images)
    saved = total_before - total_after
    print(f"\nBefore : {total_before/1024:.1f} MB")
    print(f"After  : {total_after/1024:.1f} MB")
    print(f"Saved  : {saved/1024:.1f} MB  ({saved/total_before*100:.0f}%)")

if __name__ == "__main__":
    main()
