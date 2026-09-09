"""Build site assets from the AI-edited masters in ai/<id>.png (864x1152, 3:4)."""
import json, os, sys, glob
import numpy as np
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)); P = os.path.expanduser('~/the-mile-barbershop/assets/img')
os.makedirs(f'{P}/feed', exist_ok=True); os.makedirs(f'{P}/sq', exist_ok=True)
log = json.load(open(f'{S}/out/log.json')) if os.path.exists(f'{S}/out/log.json') else {}
ids = sys.argv[1:] or [os.path.basename(f)[:-4] for f in sorted(glob.glob(f'{S}/ai/p*.png'))]
INTERIOR = {'p004': 'hero-chair', 'p001': 'hero-room', 'p011': 'hex', 'p007': 'lounge'}
done = []
for pid in ids:
    im = Image.open(f'{S}/ai/{pid}.png').convert('RGB'); W, H = im.size
    if pid in INTERIOR:
        stem = INTERIOR[pid]
        if stem.startswith('hero'):
            im.resize((1080, 1440), Image.LANCZOS).save(f'{P}/{stem}-1080.webp', quality=84, method=6)
            im.resize((1620, 2160), Image.LANCZOS).save(f'{P}/{stem}-1620.webp', quality=82, method=6)
        else:
            im.resize((900, 1200), Image.LANCZOS).save(f'{P}/{stem}-900.webp', quality=84, method=6)
        if pid == 'p001':
            fl = im.crop((0, int(H * 0.68), W, H)).resize((1600, 676), Image.LANCZOS)
            Image.fromarray((np.asarray(fl).astype(np.float32) * 0.62).astype(np.uint8)).save(f'{P}/floor.webp', quality=78, method=6)
        if pid == 'p011':
            from scipy.ndimage import gaussian_filter
            hb = gaussian_filter(np.asarray(im.resize((450, 600))).astype(np.float32) / 255.0, (9, 9, 0)) * 0.55
            Image.fromarray((hb * 255).astype(np.uint8)).save(f'{P}/hex-blur.webp', quality=70, method=6)
        if pid == 'p004':
            ch = int(W * 630 / 1200); top = int(H * 0.22)
            im.crop((0, top, W, top + ch)).resize((1200, 630), Image.LANCZOS).save(f'{P}/og.jpg', quality=84)
        done.append(pid); continue
    # feed: native 3:4
    im.save(f'{P}/feed/{pid}.webp', quality=86, method=6)
    # square: anchor on the head using the geometry measured on the original (same 3:4 framing → scale by W/1800)
    g = (log.get(pid) or {}).get('geom'); side = W
    if g and g.get('top') is not None:
        sc = W / 1800.0; head_top = g['top'] * sc; head_w = g['w'] * sc
        top = int(max(0, min(H - side, head_top - 0.12 * side)))
    else:
        top = 0 if H - side < 0.25 * H else int((H - side) * 0.25)
    im.crop((0, top, side, top + side)).save(f'{P}/sq/{pid}.webp', quality=86, method=6)
    done.append(pid)
print('built', len(done), done[:8], '...')
