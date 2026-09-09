"""Interior shots: geometry fix, local clean-ups (TV, red bin), unified grade, LED bloom, exports."""
import numpy as np
from PIL import Image, ImageOps, ImageDraw
from scipy.ndimage import gaussian_filter
import sys; sys.path.insert(0, '.')
from enhance import grade, vignette, lum

def poly_mask(size, pts, feather):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return gaussian_filter(np.asarray(m).astype(np.float32) / 255.0, feather)

def keystone(img, k):
    W, H = img.size; d = int(k * W)
    return img.transform((W, H), Image.QUAD, (0, 0, d, H, W - d, H, W, 0), resample=Image.BICUBIC)

def bloom(img, amount=0.32, sigma=28, thr=0.82):
    hl = np.clip((lum(img) - thr) / (1 - thr), 0, 1)
    glow = gaussian_filter(hl, sigma)[..., None]
    return np.clip(img + glow * amount * np.array([1.0, 1.0, 1.02]), 0, 1)

def dim_region(img, mask, blur_sigma, mult, tint, desat):
    if blur_sigma > 0:
        b = gaussian_filter(img, (blur_sigma, blur_sigma, 0))
    else: b = img
    l = lum(b)[..., None]; b = l + (b - l) * (1 - desat)
    b = b * mult + np.array(tint)
    return img * (1 - mask[..., None]) + b * mask[..., None]

def export(full, stem, sizes):
    full.save(f'out/master/{stem}.jpg', quality=93)
    for w, h, tag in sizes:
        full.resize((w, h), Image.LANCZOS).save(f'out/{stem}-{tag}.webp', quality=80, method=6)

O = dict(wb=0.35, target=0.40, k=2.2, sat=0.92, split=1.0, vib=0.12, lo=0.3, hi=99.8, lift=0.01)

# ---- p004: hero (chair + hex + TV) ----
im = ImageOps.exif_transpose(Image.open('gbp/p004.jpg')).convert('RGB'); W, H = im.size
img = np.asarray(im).astype(np.float32) / 255.0
tv = poly_mask(im.size, [(870, 30), (1680, 85), (1680, 505), (930, 625)], 6)
img = dim_region(img, tv, 55, 0.16, [0.02, 0.025, 0.035], 0.7)
bin_ = poly_mask(im.size, [(1540, 1480), (1800, 1470), (1800, 2130), (1560, 2110)], 14)
img = dim_region(img, bin_, 0, 0.78, [0, 0, 0], 0.85)
cart = poly_mask(im.size, [(0, 1540), (200, 1540), (200, 1700), (0, 1700)], 12)
img = dim_region(img, cart, 0, 0.9, [0, 0, 0], 0.6)
img = grade(img, O); img = bloom(img, 0.30); img = vignette(img, 0.22)
full = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
full = keystone(full.rotate(-2.0, resample=Image.BICUBIC), 0.05)
mx, my = int(W * 0.045), int(H * 0.035); full = full.crop((mx, my, W - mx, H - my)).resize((1800, 2400), Image.LANCZOS)
export(full, 'hero-chair', [(1080, 1440, '1080'), (1620, 2160, '1620')]); print('p004 done')

# ---- p001: hero (hex ceiling + window + floor) ----
im = ImageOps.exif_transpose(Image.open('gbp/p001.jpg')).convert('RGB'); W, H = im.size
img = np.asarray(im).astype(np.float32) / 255.0
win = poly_mask(im.size, [(0, 540), (990, 560), (990, 1270), (0, 1290)], 18)
img = dim_region(img, win, 0, 0.70, [0, 0, 0.005], 0.35)
tv = poly_mask(im.size, [(1570, 290), (1800, 250), (1800, 640), (1590, 640)], 6)
img = dim_region(img, tv, 40, 0.18, [0.02, 0.025, 0.035], 0.7)
img = grade(img, O); img = bloom(img, 0.34); img = vignette(img, 0.22)
full = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
export(full, 'hero-room', [(1080, 1440, '1080'), (1620, 2160, '1620')])
floor = full.crop((0, 1640, 1800, 2400)).resize((1600, 676), Image.LANCZOS)
floor = Image.fromarray((np.asarray(floor).astype(np.float32) * 0.62).astype(np.uint8)); floor.save('out/floor.webp', quality=78, method=6); print('p001 done')

# ---- p011: hex ceiling close-up ----
im = ImageOps.exif_transpose(Image.open('gbp/p011.jpg')).convert('RGB')
img = np.asarray(im).astype(np.float32) / 255.0
img = grade(img, dict(O, target=0.36)); img = bloom(img, 0.36, 30); img = vignette(img, 0.18)
full = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
export(full, 'hex', [(900, 1200, '900')])
hb = gaussian_filter(np.asarray(full.resize((450, 600))).astype(np.float32) / 255.0, (9, 9, 0)) * 0.55
Image.fromarray((hb * 255).astype(np.uint8)).save('out/hex-blur.webp', quality=70, method=6); print('p011 done')

# ---- p007: waiting area ----
im = ImageOps.exif_transpose(Image.open('gbp/p007.jpg')).convert('RGB')
img = np.asarray(im).astype(np.float32) / 255.0
tv = poly_mask(im.size, [(1040, 460), (1560, 420), (1560, 830), (1040, 840)], 6)
img = dim_region(img, tv, 40, 0.18, [0.02, 0.025, 0.035], 0.7)
img = grade(img, dict(O, target=0.42)); img = vignette(img, 0.22)
full = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
export(full, 'lounge', [(900, 1200, '900')]); print('p007 done')
