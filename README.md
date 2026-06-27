# Bara Ghiles — Portfolio

Live site built with vanilla JS, no framework required.

## 🚀 Deploy to GitHub Pages

### First time
```bash
# 1. Create a new repo on GitHub named:  bara-ghiles-portfolio
#    (or any name — the Pages URL will reflect it)

# 2. Clone and push
git init
git add .
git commit -m "initial: portfolio launch"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bara-ghiles-portfolio.git
git push -u origin main
```

### Enable Pages
1. Go to **Settings → Pages** in your repo
2. Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/ (root)**
4. Click **Save**

Your site will be live at:
`https://YOUR_USERNAME.github.io/bara-ghiles-portfolio/`

---

## 📁 Structure

```
/
├── index.html          ← the entire site (self-contained, no deps)
├── .nojekyll           ← disables Jekyll so GitHub Pages serves as-is
├── README.md
└── src/                ← source files (edit here, then rebuild)
    ├── shell.html
    ├── build.py
    ├── css/
    │   └── styles.css
    └── js/
        ├── app.js
        └── components/
            ├── borderglow.js
            ├── bubblemenu.js
            ├── cardswap.js
            ├── circulargallery.js
            ├── colorbends.js
            ├── counter.js
            ├── gooeynav.js
            ├── iconcloud.js
            ├── imagetrail.js
            ├── magicbento.js
            ├── morphingtext.js
            ├── noise.js
            ├── shapeblur.js
            ├── smoothcursor.js
            ├── strands.js
            ├── testimonials.js
            ├── text3dflip.js
            └── tiltedcard.js
```

## 🛠 Rebuild after edits

```bash
cd src
python3 build.py
# outputs → src/dist/index.html
# copy it back to root:
cp dist/index.html ../index.html
```

## ✅ What's included

- Hero with animated strands background + 3D text flip
- About section with your photo (minimal fade-in + accent line)
- Work grid (MagicBento with spotlight effect)
- Circular gallery (drag/scroll process carousel)
- Showcase (CardSwap, TiltedCard, ShapeBlur, ImageTrail)
- Lab (ColorBends WebGL + GooeyNav + IconCloud 3D sphere)
- Testimonials (WebGL particle field + infinite carousel)
- Contact section + enhanced footer with real social links
- Smooth cursor (spring-physics trailing dot + SVG tail)
- Noise overlay, scroll reveal, bubble nav menu
