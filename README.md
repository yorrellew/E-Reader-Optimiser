# E-Reader Cover & Metadata Studio

A modern, high-performance web tool to edit, format, and organize metadata and covers for **EPUB** and **PDF** e-books. Tailored specifically for e-ink readers including **Kindle, Kobo, Boox, reMarkable, and PocketBook**.

Runs 100% in your browser with no file uploads to external servers, ensuring complete privacy and fast local processing.

---

## ✨ Features

- **EPUB & PDF Support**:
  - Full client-side EPUB parser and repackager (`JSZip`).
  - Native PDF metadata reader and mutator (`pdf-lib`, `pdfjs-dist`).
- **Batch Processing**:
  - Multi-file bulk upload and directory batch import.
  - Universal metadata applicator ("Apply to All").
  - Batch zip downloader for single-click export.
  - Configurable compression levels (0–9) to optimize file size vs. write speed.
- **Smart Metadata & Online Search**:
  - Integrated search querying **Google Books** and **Open Library** for high-resolution cover art, descriptions, ISBN, publication dates, and subjects.
  - Automatic series indexing and title/author cleaning.
  - Dynamic client-side fallback for static deployments (GitHub Pages).
- **Custom Typography Cover Studio**:
  - Generate custom e-ink covers with editorial serif typography, frames, borders, and decorative monograms.
  - 12+ device aspect ratio presets (Kindle Paperwhite, Scribe, Oasis, Kobo Libra, Boox Palma, etc.).
- **E-Ink Optimization**:
  - High-contrast grayscale converter.
  - Smart contrast enhancer and sharpening filters designed specifically for 16-level grayscale E-Ink Carta screens.
- **Client-Side Privacy**:
  - All file manipulation, decompression, and re-compression occur entirely within your browser.
  - No files or books are uploaded to a remote server.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm (or bun / pnpm)

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/<repository-name>.git
cd <repository-name>

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 📦 Building for Production & GitHub Pages

### Static Build (GitHub Pages)
```bash
npm run build:pages
```
This runs `vite build` and outputs static HTML, CSS, and JS assets into the `dist/` folder with relative paths (`base: './'`), ready for any static web host.

### Full-Stack Build (Node.js Server)
```bash
npm run build
npm start
```
Compiles both the frontend and the Express backend server into `dist/server.cjs`.

---

## 📁 Repository Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Actions workflow for GitHub Pages
├── public/
│   └── .nojekyll             # Prevents GitHub Pages Jekyll build filtering
├── src/
│   ├── components/           # UI components (Editor, Batch Toolbar, Modals, etc.)
│   ├── utils/                # EPUB engine, PDF engine, image processor, presets
│   ├── App.tsx               # Main application component
│   └── main.tsx              # React entry point
├── index.html                # Main HTML entry point
├── package.json              # Project scripts & dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration with relative base for GitHub Pages
```

---

## 📄 License

MIT License. Feel free to use, modify, and distribute.
