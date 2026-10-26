# Re-subset the self-hosted fonts after changing site copy.
# Needs: pip install fonttools brotli; source TTFs (google/fonts repo) in the working dir:
#   InstrumentSerif-Regular.ttf, InstrumentSerif-Italic.ttf, JetBrainsMono[wght].ttf, SpaceGrotesk[wght].ttf, NotoSerifSC[wght].ttf

import glob, os, re
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
site = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
text = "".join(open(f, encoding="utf-8").read() for f in [site + "/index.html"] + glob.glob(site + "/js/*.js"))
cjk = sorted({c for c in text if ord(c) > 0x2E7F})
latin = "".join(chr(i) for i in range(0x20, 0x7F)) + "".join(chr(i) for i in range(0xA0, 0x180)) + "‘’“”—–…·•→←↑↓↗↘×÷±≈≤≥∞°′″™©®€✳◎⇡⟳⚡▶↳·"
print("cjk glyph candidates:", len(cjk))
out = site + "/assets/fonts"; os.makedirs(out, exist_ok=True)
def save(font, chars, path):
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]; opts.name_IDs = ["*"]; opts.notdef_outline = True
    sub = subset.Subsetter(opts); sub.populate(text=chars); sub.subset(font)
    font.flavor = "woff2"; font.save(path); print(os.path.basename(path), os.path.getsize(path))
for src, dst in [("InstrumentSerif-Regular.ttf", "instrument-serif.woff2"), ("InstrumentSerif-Italic.ttf", "instrument-serif-italic.woff2"), ("JetBrainsMono[wght].ttf", "jetbrains-mono.woff2"), ("SpaceGrotesk[wght].ttf", "space-grotesk.woff2")]:
    save(TTFont(src), latin, f"{out}/{dst}")
chars = "".join(cjk) + latin + "，。、；：？！「」『』（）《》【】——……·"
for w in (500, 900):
    f = instancer.instantiateVariableFont(TTFont("NotoSerifSC[wght].ttf"), {"wght": w})
    save(f, chars, f"{out}/noto-serif-sc-{w}.woff2")
