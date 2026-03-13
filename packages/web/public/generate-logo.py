#!/usr/bin/env python3
"""
ClawNet Logo — Nodal Precision (v3)
Three nodes in equilateral mesh. Each vertex extends a compact geometric
trident — three short straight strokes that read as a network node
radiating signal/grip. Clean, architectural, no curves.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

FONTS_DIR = os.path.expanduser("~/.claude/skills/canvas-design/canvas-fonts")
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

BG = (9, 9, 11)
TEAL = (45, 212, 191)
TEAL_DIM = (20, 94, 85)
TEAL_MID = (32, 148, 133)
ZINC_800 = (39, 39, 42)
ZINC_700 = (63, 63, 70)
ZINC_400 = (161, 161, 170)
WHITE = (250, 250, 250)
AMBER = (251, 191, 36)


def draw_icon(size=1024, bg_color=None, fg_color=None, dim_color=None):
    bg_color = bg_color or BG
    fg_color = fg_color or TEAL
    dim_color = dim_color or TEAL_DIM

    img = Image.new("RGBA", (size, size), (*bg_color, 255))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size * 0.52  # slight vertical offset for optical center
    R = size * 0.26

    angles_deg = [-90, 150, 30]
    nodes = []
    for a in angles_deg:
        rad = math.radians(a)
        nodes.append((cx + R * math.cos(rad), cy + R * math.sin(rad)))

    # --- Mesh edges (triangle) ---
    ew = max(2, int(size * 0.018))
    for i in range(3):
        j = (i + 1) % 3
        draw.line([nodes[i], nodes[j]], fill=dim_color, width=ew)

    # --- Radial spokes from center to nodes ---
    fw = max(1, int(size * 0.005))
    for nx, ny in nodes:
        draw.line([(cx, cy), (nx, ny)], fill=dim_color, width=fw)

    # --- Center hub ---
    cr = max(2, int(size * 0.016))
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=dim_color)

    # --- Trident forks at each node ---
    # Three short straight prongs: one center (longer), two angled (shorter)
    prong_len = size * 0.065
    side_len = size * 0.055
    spread = 0.50  # radians between center prong and side prongs
    pw = max(2, int(size * 0.013))

    for nx, ny in nodes:
        outward = math.atan2(ny - cy, nx - cx)

        # Center prong
        ex = nx + prong_len * math.cos(outward)
        ey = ny + prong_len * math.sin(outward)
        draw.line([(nx, ny), (ex, ey)], fill=fg_color, width=pw)

        # Side prongs
        for sign in [-1, 1]:
            a = outward + sign * spread
            sx = nx + side_len * math.cos(a)
            sy = ny + side_len * math.sin(a)
            draw.line([(nx, ny), (sx, sy)], fill=fg_color, width=pw)

    # --- Node circles (on top) ---
    nr = max(3, int(size * 0.030))
    for nx, ny in nodes:
        draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=fg_color)

    return img


def draw_full_logo(width=2400, height=800):
    img = Image.new("RGBA", (width, height), (*BG, 255))
    draw = ImageDraw.Draw(img)

    isz = int(height * 0.72)
    icon = draw_icon(isz)
    ix = int(width * 0.06)
    iy = (height - isz) // 2
    img.paste(icon, (ix, iy), icon)

    tx = ix + isz + int(width * 0.025)

    try:
        fd = ImageFont.truetype(os.path.join(FONTS_DIR, "Outfit-Bold.ttf"), int(height * 0.26))
    except:
        fd = ImageFont.load_default()
    try:
        fm = ImageFont.truetype(os.path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"), int(height * 0.072))
    except:
        fm = ImageFont.load_default()

    ny = int(height * 0.25)
    draw.text((tx, ny), "ClawNet", fill=WHITE, font=fd)

    sy = ny + int(height * 0.30)
    draw.text((tx, sy), "AGENT MESH NETWORK", fill=ZINC_400, font=fm)

    ly = sy + int(height * 0.11)
    draw.line([(tx, ly), (tx + int(width * 0.22), ly)], fill=TEAL_DIM, width=2)

    return img


def draw_logo_sheet(size=2400):
    img = Image.new("RGBA", (size, size), (*BG, 255))
    draw = ImageDraw.Draw(img)
    m = int(size * 0.06)

    try:
        fl = ImageFont.truetype(os.path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"), int(size * 0.016))
    except:
        fl = ImageFont.load_default()
    try:
        ft = ImageFont.truetype(os.path.join(FONTS_DIR, "Outfit-Bold.ttf"), int(size * 0.035))
    except:
        ft = ImageFont.load_default()
    try:
        fs = ImageFont.truetype(os.path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"), int(size * 0.013))
    except:
        fs = ImageFont.load_default()

    # Header
    draw.text((m, m), "ClawNet", fill=WHITE, font=ft)
    draw.text((m, m + int(size * 0.05)), "BRAND MARK  —  NODAL PRECISION", fill=ZINC_400, font=fl)
    ry = m + int(size * 0.085)
    draw.line([(m, ry), (size - m, ry)], fill=ZINC_800, width=1)

    # Row 1: Three icon variants
    s1y = ry + int(size * 0.03)

    # Primary on dark
    icon_lg = draw_icon(int(size * 0.26))
    img.paste(icon_lg, (m, s1y), icon_lg)
    draw.text((m, s1y + int(size * 0.28)), "01  PRIMARY", fill=ZINC_700, font=fs)

    # Inverse on teal
    inv_sz = int(size * 0.19)
    icon_inv = draw_icon(inv_sz, bg_color=TEAL, fg_color=BG, dim_color=(9, 9, 11))
    inv_x = int(size * 0.40)
    inv_y = s1y + int(size * 0.035)
    img.paste(icon_inv, (inv_x, inv_y), icon_inv)
    draw.text((inv_x, inv_y + inv_sz + int(size * 0.012)), "02  INVERSE", fill=ZINC_700, font=fs)

    # Light variant
    lt_sz = int(size * 0.19)
    icon_lt = draw_icon(lt_sz, bg_color=WHITE, fg_color=TEAL_MID, dim_color=(210, 210, 215))
    lt_x = int(size * 0.66)
    lt_y = s1y + int(size * 0.035)
    img.paste(icon_lt, (lt_x, lt_y), icon_lt)
    draw.text((lt_x, lt_y + lt_sz + int(size * 0.012)), "03  LIGHT", fill=ZINC_700, font=fs)

    # Row 2: Lockup
    s2y = s1y + int(size * 0.34)
    draw.line([(m, s2y), (size - m, s2y)], fill=ZINC_800, width=1)

    full = draw_full_logo(int(size * 0.58), int(size * 0.155))
    fy = s2y + int(size * 0.025)
    img.paste(full, (m, fy), full)
    draw.text((m, fy + int(size * 0.17)), "04  LOCKUP", fill=ZINC_700, font=fs)

    # Row 3: Palette
    s3y = fy + int(size * 0.22)
    draw.line([(m, s3y), (size - m, s3y)], fill=ZINC_800, width=1)
    draw.text((m, s3y + int(size * 0.012)), "05  PALETTE", fill=ZINC_700, font=fs)

    palette = [
        ("TEAL-400", TEAL, "#2DD4BF"),
        ("ZINC-950", BG, "#09090B"),
        ("ZINC-800", ZINC_800, "#27272A"),
        ("ZINC-400", ZINC_400, "#A1A1AA"),
        ("AMBER-400", AMBER, "#FBBF24"),
        ("WHITE", WHITE, "#FAFAFA"),
    ]
    sw = int(size * 0.044)
    swy = s3y + int(size * 0.042)
    for i, (name, color, hx) in enumerate(palette):
        sx = m + i * int(size * 0.145)
        draw.rounded_rectangle(
            [sx, swy, sx + sw, swy + sw], radius=4, fill=color,
            outline=ZINC_700 if color == BG else None, width=1
        )
        draw.text((sx, swy + sw + 8), name, fill=ZINC_400, font=fs)
        draw.text((sx, swy + sw + 24), hx, fill=ZINC_700, font=fs)

    # Row 4: Typography
    s4y = swy + sw + int(size * 0.055)
    draw.line([(m, s4y), (size - m, s4y)], fill=ZINC_800, width=1)
    draw.text((m, s4y + int(size * 0.012)), "06  TYPE", fill=ZINC_700, font=fs)

    try:
        fb = ImageFont.truetype(os.path.join(FONTS_DIR, "Outfit-Bold.ttf"), int(size * 0.022))
    except:
        fb = fl
    try:
        fj = ImageFont.truetype(os.path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"), int(size * 0.018))
    except:
        fj = fl

    ty = s4y + int(size * 0.040)
    draw.text((m, ty), "Sora / Outfit Bold  —  Display", fill=ZINC_400, font=fb)
    draw.text((m, ty + int(size * 0.032)), "JetBrains Mono  —  Data & Code", fill=ZINC_400, font=fj)
    draw.text((m, ty + int(size * 0.058)), "DM Sans  —  Body Copy", fill=ZINC_400, font=fl)

    # Row 5: Specs
    s5y = ty + int(size * 0.095)
    draw.line([(m, s5y), (size - m, s5y)], fill=ZINC_800, width=1)

    specs = [
        "GEOMETRY      Equilateral mesh  ·  3-node trident terminals  ·  ±0.5 rad spread",
        "PROGRAM       CA7EjpWdE5i67TXp95jXp9LBqqYjg5M8pJP3k9zgzeR4  (Solana Devnet)",
        "NETWORK       x402 USDC micropayments  ·  OpenClaw Agent Mesh  ·  Hono + Anchor",
    ]
    for i, spec in enumerate(specs):
        draw.text((m, s5y + int(size * 0.015) + i * int(size * 0.020)), spec, fill=ZINC_700, font=fs)

    return img


if __name__ == "__main__":
    draw_icon(1024).save(os.path.join(OUT_DIR, "clawnet-icon.png"), "PNG")
    print("clawnet-icon.png  1024x1024")

    draw_icon(256).resize((32, 32), Image.LANCZOS).save(os.path.join(OUT_DIR, "favicon.png"), "PNG")
    print("favicon.png       32x32")

    draw_logo_sheet(2400).save(os.path.join(OUT_DIR, "clawnet-logo.png"), "PNG")
    print("clawnet-logo.png  2400x2400")

    draw_full_logo(2400, 800).save(os.path.join(OUT_DIR, "clawnet-full.png"), "PNG")
    print("clawnet-full.png  2400x800")
