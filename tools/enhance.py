"""The Mile barbershop — portrait/nail enhancement pipeline.
mask (U2Net) -> smart 4:5 + 1:1 crop -> blurred/darkened background -> unified grade -> export."""
import os, sys, json, glob, time
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import gaussian_filter, zoom
import onnxruntime as ort

SESS = ort.InferenceSession(os.path.expanduser('~/.u2net/u2net.onnx'), providers=['CPUExecutionProvider'])
INP = SESS.get_inputs()[0].name
OVR = json.load(open('overrides.json')) if os.path.exists('overrides.json') else {}

def u2net_mask(im):
    w, h = im.size
    x = np.asarray(im.resize((320, 320), Image.LANCZOS)).astype(np.float32) / 255.0
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    m = SESS.run(None, {INP: x})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(np.float32) / 255.0
    return m

def head_geom(mask, W, H):
    """Locate the subject's head: top row, x-center and width of the top 30% band of the mask."""
    rows = np.where((mask > 0.5).sum(axis=1) > 0.01 * W)[0]
    if len(rows) < 10: return None
    top, bottom = rows[0], rows[-1]
    band = mask[top: top + max(40, int(0.30 * (bottom - top)))] > 0.5
    ys, xs = np.where(band)
    if len(xs) < 50: return None
    return dict(top=int(top), bottom=int(bottom), cx=float(np.median(xs)), w=float(np.percentile(xs, 95) - np.percentile(xs, 5)))

def crop_box(W, H, geom, ar, wmul, minfrac, headroom):
    if geom is None:
        cw = W; ch = cw / ar
        if ch > H: ch = H; cw = ch * ar
        return (int((W - cw) / 2), int(max(0, H * 0.08 if ch < H else 0)), int(cw), int(ch))
    cw = min(W, max(geom['w'] * wmul, minfrac * W)); ch = cw / ar
    if ch > H: ch = H; cw = ch * ar
    top = geom['top'] - headroom * ch
    top = min(max(0, top), H - ch)
    left = min(max(0, geom['cx'] - cw / 2), W - cw)
    return (int(left), int(top), int(cw), int(ch))

def lum(img): return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722

def normalized_blur(img, weight, sigma, scale=4):
    """Blur only background pixels (weight=1-mask) so subject colours never bleed into the halo."""
    small = zoom(img, (1 / scale, 1 / scale, 1), order=1); ws = zoom(weight, 1 / scale, order=1)
    num = gaussian_filter(small * ws[..., None], (sigma / scale, sigma / scale, 0)); den = gaussian_filter(ws, sigma / scale)[..., None]
    bg = num / np.maximum(den, 1e-3)
    bg = zoom(bg, (img.shape[0] / bg.shape[0], img.shape[1] / bg.shape[1], 1), order=1)
    return np.clip(bg, 0, 1)

def grade(img, o):
    # 1. mild gray-world white balance (kills fluorescent casts)
    l = lum(img); mid = (l > 0.15) & (l < 0.85)
    means = np.array([img[..., c][mid].mean() for c in range(3)]) if mid.sum() > 1000 else img.reshape(-1, 3).mean(0)
    gain = means.mean() / np.maximum(means, 1e-3); gain = 1 + (gain - 1) * o.get('wb', 0.55)
    img = np.clip(img * gain, 0, 1)
    # 2. levels on luminance percentiles
    l = lum(img); lo, hi = np.percentile(l, o.get('lo', 0.4)), np.percentile(l, o.get('hi', 99.7))
    img = np.clip((img - lo) / max(hi - lo, 0.2), 0, 1)
    # 3. exposure normalisation toward a house mean
    l = lum(img); target = o.get('target', 0.46); m = max(l.mean(), 1e-3)
    g = float(np.clip(np.log(target) / np.log(m), 0.78, 1.28)); img = np.power(img, 1 / g) if abs(g - 1) > 0.02 else img
    # 4. S-curve contrast + tiny black lift
    k = o.get('k', 2.4); img = (np.tanh(k * (img - 0.5)) / np.tanh(k / 2)) * 0.5 + 0.5
    lift = o.get('lift', 0.012); img = img * (1 - lift) + lift
    # 5. split tone: slate shadows, warm highlights
    l = lum(img)[..., None]; sh = (1 - l) ** 2; hl = l ** 2
    img = img + sh * np.array([-0.018, -0.004, 0.022]) * o.get('split', 1.0) + hl * np.array([0.02, 0.008, -0.018]) * o.get('split', 1.0)
    img = np.clip(img, 0, 1)
    # 6. vibrance then gentle global desaturation (tames the loud capes)
    mx, mn = img.max(-1), img.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-3)
    l = lum(img)[..., None]; v = o.get('vib', 0.16)
    img = np.clip(l + (img - l) * (1 + v * (1 - sat))[..., None], 0, 1)
    s = o.get('sat', 0.90); l = lum(img)[..., None]; img = np.clip(l + (img - l) * s, 0, 1)
    return img

def vignette(img, strength):
    H, W = img.shape[:2]; y, x = np.mgrid[0:H, 0:W]
    r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
    v = 1 - strength * np.clip(r - 0.35, 0, 1) ** 1.6 / 0.65 ** 1.6
    return img * v[..., None]

def unsharp(img, mask, sigma, amount):
    bl = gaussian_filter(img, (sigma, sigma, 0)); hp = img - bl
    return np.clip(img + hp * amount * mask[..., None], 0, 1)

def process(path, out_id, o):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    if o.get('rot'): im = im.rotate(o['rot'], resample=Image.BICUBIC, expand=False)
    W, H = im.size
    img = np.asarray(im).astype(np.float32) / 255.0
    mask = u2net_mask(im) if not o.get('nomask') else np.ones((H, W), np.float32)
    cov = float((mask > 0.5).mean())
    geom = head_geom(mask, W, H)
    if geom is None or cov < 0.05 or cov > 0.9:
        geom = None
    # background treatment on the full frame (so crops share it)
    if not o.get('nomask'):
        fm = np.clip(gaussian_filter(mask, W * 0.006) * 1.15, 0, 1)  # feathered, slightly grown
        bg = normalized_blur(img, 1 - fm, sigma=W * o.get('blur', 0.022))
        bl = lum(bg)[..., None]; bg = bl + (bg - bl) * 0.45  # desaturate bg
        bg = bg * o.get('bgdim', 0.62) + np.array([0.0, 0.002, 0.008])  # darken + cool
        img = img * fm[..., None] + bg * (1 - fm[..., None])
        img = unsharp(img, fm, 1.6, o.get('sharp', 0.55))
        if geom is not None and o.get('cape', 1.0) > 0:
            head_h = geom['w'] * 1.35; start = geom['top'] + head_h * 1.15; ramp = head_h * 0.35
            yy = np.arange(H, dtype=np.float32)[:, None]; below = np.clip((yy - start) / max(ramp, 1), 0, 1) * np.ones((1, W), np.float32)
            cm = below * fm * o.get('cape', 1.0)
            l = lum(img)[..., None]; muted = (l + (img - l) * 0.55) * 0.9
            img = img * (1 - cm[..., None]) + muted * cm[..., None]
    img = grade(img, o)
    img = vignette(img, o.get('vig', 0.26))
    img = np.clip(img + np.random.normal(0, 0.0035, img.shape), 0, 1)
    full = Image.fromarray((img * 255 + 0.5).astype(np.uint8))
    full.save(f'out/master/{out_id}.jpg', quality=93)
    res = {'id': out_id, 'src': os.path.basename(path), 'cov': round(cov, 3), 'geom': geom}
    # crops
    fb = o.get('feed') or crop_box(W, H, geom, 4 / 5, o.get('wmul', 2.7), o.get('minfrac', 0.66), o.get('headroom', 0.09))
    sb = o.get('sq') or crop_box(W, H, geom, 1.0, o.get('wmul_sq', 2.3), o.get('minfrac_sq', 0.58), o.get('headroom_sq', 0.11))
    for name, box, size in (('feed', fb, (1080, 1350)), ('sq', sb, (900, 900))):
        c = full.crop((box[0], box[1], box[0] + box[2], box[1] + box[3])).resize(size, Image.LANCZOS)
        c.save(f'out/{name}/{out_id}.webp', quality=84, method=6)
        res[name] = box
    return res

if __name__ == '__main__':
    ids = sys.argv[1:] or [os.path.basename(f)[:-4] for f in sorted(glob.glob('gbp/p*.jpg'))]
    log = {}
    for pid in ids:
        o = OVR.get(pid, {})
        if o.get('skip'): continue
        t = time.time(); r = process(f'gbp/{pid}.jpg', pid, o); log[pid] = r
        print(pid, f'{time.time() - t:.1f}s', 'cov', r['cov'], 'feed', r['feed'], flush=True)
    json.dump(log, open('out/log.json', 'w'), indent=1)
