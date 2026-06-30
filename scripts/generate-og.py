#!/usr/bin/env python3
"""Generate the social share (OG) card for the World Cup dashboard.

Re-runnable: just `python3 scripts/generate-og.py`. Writes public/og.png
(1200x630), which Vite copies to the deploy root and index.html points at
via og:image / twitter:image.

Design: a clean, centered composition — a glowing soccer ball over a deep
emerald->black gradient, with "WORLD CUP 2026 / DASHBOARD · by Neil" and a
one-line gag. Deliberately decluttered (no kicker line, no tag chips).
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
ITAL = os.path.join(FONTS, "Arial Italic.ttf")

GOLD = (255, 209, 102)
WHITE = (255, 255, 255)
ACCENT = (52, 211, 153)  # emerald, matches the site

# The gag line under the title (Neil's inside joke). Swap freely.
TAGLINE = "We organize the tables. The drama organizes itself."


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def ctext(d, cx, y, text, fnt, fill):
    """Draw text horizontally centered on cx."""
    w = d.textlength(text, font=fnt)
    d.text((cx - w / 2, y), text, font=fnt, fill=fill)
    return w


def soccer_ball(draw, cx, cy, R):
    """A clean classic soccer ball: white sphere with a black pentagon hub."""
    draw.ellipse([cx - R, cy - R, cx + R, cy + R], fill=WHITE,
                 outline=(20, 20, 20), width=max(4, R // 22))

    def pent(ccx, ccy, rad, rot=-90):
        return [(ccx + rad * math.cos(math.radians(rot + a)),
                 ccy + rad * math.sin(math.radians(rot + a)))
                for a in range(0, 360, 72)]

    hub = pent(cx, cy, R * 0.32)
    draw.polygon(hub, fill=(17, 17, 17))
    for px, py in hub:
        ang = math.atan2(py - cy, px - cx)
        ex, ey = cx + R * 0.95 * math.cos(ang), cy + R * 0.95 * math.sin(ang)
        draw.line([(px, py), (ex, ey)], fill=(17, 17, 17), width=max(3, R // 30))
    for a in range(0, 360, 72):
        ox = cx + R * 0.66 * math.cos(math.radians(-90 + 36 + a))
        oy = cy + R * 0.66 * math.sin(math.radians(-90 + 36 + a))
        draw.polygon(pent(ox, oy, R * 0.16, rot=90), fill=(17, 17, 17))


# --- background: deep emerald -> near-black vertical gradient ---
top, bot = (12, 33, 26), (3, 10, 9)
img = Image.new("RGB", (W, H), bot)
d = ImageDraw.Draw(img)
for y in range(H):
    d.line([(0, y), (W, y)], fill=lerp(top, bot, (y / H) ** 1.1))

cx, cy, R = 600, 205, 130

# soft radial glow behind the ball
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for rad in range(int(R * 2.3), R, -6):
    a = int(9 * (1 - (rad - R) / (R * 1.3)))
    gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=ACCENT + (max(0, a),))
img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
d = ImageDraw.Draw(img)

# faint center-circle ring framing the ball
rr = int(R * 1.65)
d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=ACCENT, width=2)

# drop shadow + ball
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(sh).ellipse([cx - R, cy - R + 12, cx + R, cy + R + 12], fill=(0, 0, 0, 80))
img = Image.alpha_composite(img.convert("RGBA"), sh).convert("RGB")
d = ImageDraw.Draw(img)
soccer_ball(d, cx, cy, R)

# --- title: WORLD CUP 2026 (2026 in gold), centered ---
tf = font(BLACK, 90)
ww = d.textlength("WORLD CUP ", font=tf)
yw = d.textlength("2026", font=tf)
x = cx - (ww + yw) / 2
d.text((x, 366), "WORLD CUP ", font=tf, fill=WHITE)
d.text((x + ww, 366), "2026", font=tf, fill=GOLD)

# subtitle: DASHBOARD  ·  by Neil  (centered as one group)
sf = font(BOLD, 32)
parts = [("DASHBOARD", GOLD), ("   ·   ", (120, 140, 150)), ("by Neil", WHITE)]
gw = sum(d.textlength(t, font=sf) for t, _ in parts)
x = cx - gw / 2
for t, col in parts:
    d.text((x, 470), t, font=sf, fill=col)
    x += d.textlength(t, font=sf)

# the gag line
ctext(d, cx, 535, TAGLINE, font(ITAL, 29), (140, 160, 175))

img.save(OUT, "PNG")
print(f"wrote {os.path.abspath(OUT)}  ({os.path.getsize(OUT)//1024} KB)")
