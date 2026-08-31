# Tmi Landing Page

A simple one-page website for a sole proprietorship (Tmi) focused on construction and property maintenance.

## Quick start

Open `index.html` in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

## Customization

### Business name

Update in two places:

1. `index.html` — hero `<h1>` and `<title>`
2. `js/main.js` — `BUSINESS_NAME` constant (used in footer)

### Contact details

Edit the contact section in `index.html`: phone number, email, Facebook/Instagram links.

### Images

Replace files in `images/`:

- `hero-placeholder.jpg` — hero banner (recommended: 1920×1080 or wider)
- `images/references/ref-1.jpg` … `ref-6.jpg` — gallery photos (recommended: 800×600 or similar 4:3 ratio)

Keep the same filenames or update the `src` attributes in `index.html`.

### Translations (fi / en / sv)

All translatable text lives in `js/content.js` under `fi`, `en`, and `sv` keys.

HTML elements use `data-i18n="key.name"` attributes. The default locale is Finnish (`fi`), set in `js/main.js` as `DEFAULT_LOCALE`.

To switch language programmatically, call `applyLocale('en')` or `applyLocale('sv')`. A language switcher UI can be added later.

### Accent color

Change `--accent` and `--accent-hover` in `css/styles.css`.

## File structure

```
├── index.html
├── css/styles.css
├── js/content.js
├── js/main.js
├── images/
│   ├── hero-placeholder.jpg
│   └── references/
└── favicon.svg
```

## Deployment

Upload the entire folder to any static host (Netlify, GitHub Pages, traditional web hosting). No build step required.
