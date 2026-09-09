# tools
- `gmaps-full.mjs <maps url> <outdir>` / `gmaps-reviews2.mjs` — Playwright pull of a Google Business Profile (facts, photos, reviews). Needs `/Users/user/aios/node_modules/playwright` + the ms-playwright headless shell.
- `enhance.py [ids]` — portrait pipeline: U2Net mask via onnxruntime (`~/.u2net/u2net.onnx`), normalized background blur, cape muting, unified grade, 4:5 + 1:1 WebP export. Reads `overrides.json`.
- `interior.py` — interior shots: keystone/roll fix, TV/red-bin clean-up, LED bloom, hero exports.
- `shot.mjs [url]` — headless iPhone + desktop screenshots for verification.
