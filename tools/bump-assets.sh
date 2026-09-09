#!/usr/bin/env bash
# Re-version every image URL after changing files in assets/img (they ship with an immutable 1-year cache header).
set -euo pipefail
cd "$(dirname "$0")/.."
V=$(cat assets/img/feed/*.webp assets/img/sq/*.webp assets/img/*.webp | shasum | cut -c1-8)
sed -i '' -E "s/assetVersion: '[^']*'/assetVersion: '$V'/" js/content.js
sed -i '' -E "s/(assets\/img\/[A-Za-z0-9-]+\.(webp|jpg))\?v=[A-Za-z0-9]+/\1?v=$V/g" index.html
sed -i '' -E "s/(hex-blur\.webp)\?v=[A-Za-z0-9]+/\1?v=$V/g" css/styles.css
echo "assets versioned as $V"
