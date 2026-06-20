#!/usr/bin/env python3
"""Generate the social share (OG) card for the World Cup dashboard.

Re-runnable: just `python3 scripts/generate-og.py`. Writes public/og.png
(1200x630), which Vite copies to the deploy root and index.html points at
via og:image / twitter:image.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "og.png")

FONTS = "/System/Library/Fonts/Supplemental"
BLACK = os.path.join(FONTS, "Arial Black.ttf")
BOLD = os.path.join(FONTS, "Arial Bold.ttf")
REG = os.path.join(FONTS, "Arial.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new("RGB", (W, H), (8, 40, 26))
d = ImageDraw.Draw(img)

# Vertical pitch gradient (deep green -> brighter emerald)
top, bot = (6, 38, 24), (16, 89, 58)
for y in range(H):
    d.line([(0, y), (W, y)], fill=lerp(top, bot, y / H))

# Subtle mowed-pitch stripes
stripe = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(stripe)
sw = W // 8
for i in range(0, 8, 2):
    sd.rectangle([i * sw, 0, (i + 1) * sw, H], fill=(255, 255, 255, 10))
img = Image.alpha_composite(img.convert("RGBA"), stripe).convert("RGB")
d = ImageDraw.Draw(img)

# Faint center-circle field marking on the right side
cx, cy, r = 960, 315, 250
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 60), width=4)
d.line([(cx, cy - r), (cx, cy + r)], fill=(255, 255, 255), width=0)


def soccer_ball(draw, cx, cy, R):
    """A clean classic soccer ball: white sphere with a black pentagon hub."""
    draw.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(255, 255, 255),
                 outline=(20, 20, 20), width=6)

    def pent(ccx, ccy, rad, rot=-90):
        return [
            (ccx + rad * math.cos(math.radians(rot + a)),
             ccy + rad * math.sin(math.radians(rot + a)))
            for a in range(0, 360, 72)
        ]

    hub = pent(cx, cy, R * 0.32)
    draw.polygon(hub, fill=(17, 17, 17))
    # Seams radiating out to the rim
    for px, py in hub:
        ang = math.atan2(py - cy, px - cx)
        ex, ey = cx + R * 0.95 * math.cos(ang), cy + R * 0.95 * math.sin(ang)
        draw.line([(px, py), (ex, ey)], fill=(17, 17, 17), width=5)
    # Small outer pentagons between the seams
    for a in range(0, 360, 72):
        ox = cx + R * 0.66 * math.cos(math.radians(-90 + 36 + a))
        oy = cy + R * 0.66 * math.sin(math.radians(-90 + 36 + a))
        draw.polygon(pent(ox, oy, R * 0.16, rot=90), fill=(17, 17, 17))


soccer_ball(d, 960, 315, 150)

# --- Text block (left) ---
GOLD = (255, 209, 102)
WHITE = (255, 255, 255)

# Kicker
kf = font(BOLD, 30)
d.text((70, 92), "FIFA  ·  USA · CANADA · MEXICO", font=kf, fill=GOLD)

# Headline
hf = font(BLACK, 118)
d.text((66, 132), "WORLD", font=hf, fill=WHITE)
d.text((66, 250), "CUP", font=hf, fill=WHITE)
yf = font(BLACK, 118)
# "2026" in gold, to the right of CUP
cup_w = d.textlength("CUP", font=hf)
d.text((66 + cup_w + 30, 250), "2026", font=yf, fill=GOLD)

# "by Neil" signature
sf = font(BOLD, 56)
d.text((70, 392), "by Neil", font=sf, fill=GOLD)

# Tagline chips
chip_f = font(BOLD, 26)
chips = ["Live scores", "Groups", "Bracket", "Golden Boot"]
x = 70
y = 500
for c in chips:
    tw = d.textlength(c, font=chip_f)
    pad = 22
    d.rounded_rectangle([x, y, x + tw + pad * 2, y + 52], radius=26,
                        fill=None, outline=WHITE, width=3)
    d.text((x + pad, y + 11), c, font=chip_f, fill=WHITE)
    x += tw + pad * 2 + 16

img.save(OUT, "PNG")
print(f"wrote {os.path.abspath(OUT)}  ({os.path.getsize(OUT)//1024} KB)")
