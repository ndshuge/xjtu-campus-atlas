"""Check the deliberately contrasting synthetic wall/sphere screenshot test.

Requires Pillow. This checks only the center of the synthetic sphere, not
geographic accuracy or arbitrary scene occlusion.
"""
import json
from pathlib import Path
import sys

from PIL import Image

folder = Path(sys.argv[1] if len(sys.argv) > 1 else '../../docs/quality-v2/r14-map-depth')
data = json.loads((folder / 'results.json').read_text(encoding='utf-8'))
items = [r for r in data['results'] if 'filename' in r]
assert len(items) == 8 and not data['errors'], 'Missing screenshot or browser error'
for entry in items:
    x = round((entry['projectedCenter'][0] + 1) * entry['width'] / 2)
    y = round((1 - entry['projectedCenter'][1]) * entry['height'] / 2)
    with Image.open(folder / entry['filename']) as image:
        r, g, b = image.convert('RGB').getpixel((x, y))
    should_be_wall = entry['mode'] == 'shared' and entry['bearing'] == 0
    expected = b > r * 1.3 if should_be_wall else r > b * 2
    assert expected, f"Unexpected center pixel {entry['filename']}: {(r, g, b)}"
    print(f"PASS {entry['filename']} center={(r, g, b)} {'wall' if should_be_wall else 'sphere'}")
