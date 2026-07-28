"""Rebuild logo assets from client/public/logo.png (original artwork)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "client" / "public"
SOURCE = PUBLIC / "logo.png"


def remove_light_background(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    neutral = (np.abs(r.astype(int) - g.astype(int)) < 18) & (
        np.abs(g.astype(int) - b.astype(int)) < 18
    )
    bg = (lum > 210) & neutral
    arr[bg, 3] = 0
    return Image.fromarray(arr)


def autocrop(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def extract_shield(img: Image.Image) -> Image.Image:
    w, h = img.size
    # Shield sits above the wordmark in the original file.
    shield = img.crop((0, 0, w, int(h * 0.62)))
    return autocrop(shield)


def build_full_for_dark(img: Image.Image) -> Image.Image:
    """Keep original shield colors; render wordmark as solid white (not washed-out blue)."""
    arr = np.array(img.convert("RGBA"))
    h = arr.shape[0]
    text_top = int(h * 0.62)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    alpha = arr[:, :, 3]

    # Dark navy wordmark from the original logo.
    text_mask = np.zeros(arr.shape[:2], dtype=bool)
    region = (lum < 95) & (alpha > 0)
    text_mask[text_top:, :] = region[text_top:, :]

    arr[text_mask, 0] = 244
    arr[text_mask, 1] = 244
    arr[text_mask, 2] = 245
    arr[text_mask, 3] = 255

    return Image.fromarray(arr)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing original logo: {SOURCE}")

    original = Image.open(SOURCE)
    transparent = remove_light_background(original)
    shield = extract_shield(transparent)
    full_dark = autocrop(build_full_for_dark(transparent))

    shield.save(PUBLIC / "logo-mark.png", optimize=True)
    full_dark.save(PUBLIC / "logo-full.png", optimize=True)
    full_dark.save(PUBLIC / "logo-dark.png", optimize=True)

    print("Wrote logo-mark.png, logo-full.png, logo-dark.png from logo.png")


if __name__ == "__main__":
    main()
