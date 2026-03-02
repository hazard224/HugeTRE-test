# HugeRTE Test

A React app for testing and editing rich HTML content using [HugeRTE](https://github.com/hugerte/hugerte) — an open-source fork of TinyMCE. The editor is self-hosted (no CDN/API key required) and prioritises **HTML fidelity**: content is never normalised or sanitised.

🔗 **Live demo:** https://hazard224.github.io/HugeTRE-test/

---

## Features

### Editor
- **WYSIWYG view** — full HugeRTE editor with a rich toolbar
- **Code view** — raw HTML editor with PrismJS syntax highlighting and smart Tab/Enter auto-indentation
- Seamless switching between views with content kept in sync

### Toolbar
| Button | Description |
|--------|-------------|
| Undo / Redo | History navigation |
| Format Code | Auto-indents the raw HTML |
| Bold, Italic, Underline, Strikethrough | Inline formatting |
| Font Family / Font Size | Full font controls |
| Text Color | Foreground color picker |
| Text Highlight | Background highlight color picker |
| Editor Background Color | Changes the editor's canvas background |
| Align Left / Center / Right | Paragraph alignment (one always active) |
| Bullet list / Numbered list | List formatting |
| Table | Full table insertion and editing |
| WYSIWYG / Code toggle | Switch editor views |

### HTML Preservation
- `verify_html: false` and `extended_valid_elements: '*[*]'` — all tags and attributes are kept intact
- `convert_urls: false` — URLs are never rewritten
- `entity_encoding: raw` — special characters are not encoded
- Semantic elements (`<nav>`, `<header>`, `<footer>`, `<article>`, etc.) are rendered with dashed outlines in the editor so their boundaries are visible

### Preview Panel
- **iframe preview** — renders the current HTML in an isolated frame with configurable background color
- **Raw HTML panel** — shows the exact HTML string being managed by the editor

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [HugeRTE](https://github.com/hugerte/hugerte) | Rich text editor (self-hosted in `public/hugerte/`) |
| [@hugerte/hugerte-react](https://www.npmjs.com/package/@hugerte/hugerte-react) | React wrapper for HugeRTE |
| [react-simple-code-editor](https://www.npmjs.com/package/react-simple-code-editor) | Code view textarea |
| [PrismJS](https://prismjs.com) | HTML/CSS syntax highlighting |
| [gh-pages](https://www.npmjs.com/package/gh-pages) | GitHub Pages deployment |

---

## Getting Started

```bash
npm install
```

### Development server
```bash
npm run dev
```

### Production build
```bash
npm run build
```

### Preview production build locally
```bash
npm run preview
```

### Deploy to GitHub Pages
```bash
npm run deploy
```
