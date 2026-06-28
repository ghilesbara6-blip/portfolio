#!/usr/bin/env python3
"""
build.py — assembles dist/index.html from the source modules in this project.

Run from the project root:
    python3 build.py

It inlines css/styles.css and every js/components/*.js file (in a fixed,
dependency-safe order) plus js/app.js into shell.html, replacing the
__STYLES__ and __SCRIPTS__ placeholders, and writes the result to
dist/index.html.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

SHELL_PATH = os.path.join(ROOT, "shell.html")
CSS_PATH = os.path.join(ROOT, "css", "styles.css")
COMPONENTS_DIR = os.path.join(ROOT, "js", "components")
APP_JS_PATH = os.path.join(ROOT, "js", "app.js")
OUT_PATH = os.path.join(ROOT, "dist", "index.html")

# Order matters only in that app.js (which calls all of these) must come
# last; the components themselves don't depend on each other.
COMPONENT_ORDER = [
    "noise.js",
    "strands.js",
    "siderays.js",
    "softaurora.js",
    "colorbends.js",
    "shapeblur.js",
    "circulargallery.js",
    "bubblemenu.js",
    "gooeynav.js",
    "magicbento.js",
    "borderglow.js",
    "counter.js",
    "cardswap.js",
    "tiltedcard.js",
    "imagetrail.js",
    "text3dflip.js",
    "iconcloud.js",
    "morphingtext.js",
    "smoothcursor.js",
    "testimonials.js",
    "spotlightcards.js",
    "sitesearchbar.js",
    "docknavbar.js",
    "fallingtext.js",
]


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main():
    shell = read(SHELL_PATH)
    css = read(CSS_PATH)

    js_chunks = []
    for filename in COMPONENT_ORDER:
        path = os.path.join(COMPONENTS_DIR, filename)
        js_chunks.append(read(path))
    js_chunks.append(read(APP_JS_PATH))
    js_combined = "\n\n".join(js_chunks)

    out = shell.replace("__STYLES__", css).replace("__SCRIPTS__", js_combined)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(out)

    print(f"Built {OUT_PATH} ({len(out):,} bytes)")


if __name__ == "__main__":
    main()
