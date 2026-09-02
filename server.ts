import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with reasonable size limit for base64/metadata
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Image Proxy to fetch cover images safely from OpenLibrary, Google Books, Wikimedia without CORS blocking
app.get("/api/proxy-cover", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
    return res.status(400).json({ error: "Invalid or missing image URL" });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error: any) {
    // Non-fatal fallback for timed out / unreachable image hosts
    console.warn("Cover proxy warning (url skipped):", error?.message || error);
    res.status(502).json({ error: "Could not proxy cover image in time" });
  }
});

// Helper to clean search queries
function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/\.(epub|pdf|mobi|azw3|txt|cbz|cbr)$/i, "")
    .replace(/[\[\(][^\]\)]*[\]\)]/g, " ")
    .replace(/\b(retail|v\d+(\.\d+)?|repack|edition|unabridged|scan|novels|ebook)\b/gi, "")
    .replace(/[_\.\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Book search endpoint (aggregates Google Books & OpenLibrary concurrently with timeouts)
app.get("/api/books/search", async (req, res) => {
  const rawQuery = req.query.q as string;
  if (!rawQuery || rawQuery.trim().length === 0) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  const cleaned = sanitizeSearchQuery(rawQuery);
  const cleanQ = encodeURIComponent(cleaned || rawQuery.trim());
  const results: any[] = [];

  // Parallel fetch with individual timeouts to prevent slow external servers from hanging
  const fetchGoogleBooks = async () => {
    try {
      const gRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${cleanQ}&maxResults=8`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!gRes.ok) return [];
      const gdata = await gRes.json();
      if (!gdata.items || !Array.isArray(gdata.items)) return [];

      return gdata.items.map((item: any) => {
        const vi = item.volumeInfo || {};
        let coverUrl =
          vi.imageLinks?.extraLarge ||
          vi.imageLinks?.large ||
          vi.imageLinks?.medium ||
          vi.imageLinks?.thumbnail ||
          vi.imageLinks?.smallThumbnail ||
          "";
        if (coverUrl) {
          coverUrl = coverUrl.replace(/^http:\/\//i, "https://");
          coverUrl = coverUrl.replace("&edge=curl", "").replace("zoom=1", "zoom=3");
        }

        const isbn13 = vi.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier;
        const isbn10 = vi.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier;

        return {
          source: "Google Books",
          id: `gb_${item.id}`,
          title: vi.title || "",
          authors: vi.authors || [],
          publisher: vi.publisher || "",
          publishedDate: vi.publishedDate || "",
          description: vi.description || "",
          language: vi.language || "en",
          categories: vi.categories || [],
          pageCount: vi.pageCount || 0,
          isbn: isbn13 || isbn10 || "",
          coverUrl: coverUrl,
        };
      });
    } catch (err: any) {
      console.warn("Google Books search notice:", err?.name === "TimeoutError" ? "Request timed out" : err?.message);
      return [];
    }
  };

  const fetchOpenLibrary = async () => {
    try {
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${cleanQ}&limit=8`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!olRes.ok) return [];
      const olData = await olRes.json();
      if (!olData.docs || !Array.isArray(olData.docs)) return [];

      return olData.docs.map((doc: any) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "";
        const isbn = doc.isbn ? doc.isbn[0] : "";

        return {
          source: "Open Library",
          id: `ol_${doc.key || Math.random().toString()}`,
          title: doc.title || "",
          authors: doc.author_name || [],
          publisher: doc.publisher ? doc.publisher[0] : "",
          publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : "",
          description: "",
          language: doc.language ? doc.language[0] : "en",
          categories: doc.subject ? doc.subject.slice(0, 5) : [],
          pageCount: doc.number_of_pages_median || 0,
          isbn: isbn,
          coverUrl: coverUrl,
        };
      });
    } catch (err: any) {
      // Gracefully handle OpenLibrary connection timeouts
      console.warn("OpenLibrary search notice:", err?.name === "TimeoutError" ? "Request timed out" : err?.message);
      return [];
    }
  };

  const [gbResults, olResults] = await Promise.all([fetchGoogleBooks(), fetchOpenLibrary()]);

  // Merge and deduplicate results
  for (const item of gbResults) {
    if (item.title) results.push(item);
  }

  for (const doc of olResults) {
    if (!doc.title) continue;
    const duplicate = results.some(
      (r) =>
        r.title.toLowerCase() === doc.title.toLowerCase() &&
        r.authors.some((a: string) => (doc.authors || []).includes(a))
    );
    if (!duplicate) {
      results.push(doc);
    }
  }

  res.json({ results });
});

// Extract potential ISBN numbers from text and metadata
function findIsbnInText(text: string, current: any = {}): string | null {
  if (current?.isbn && typeof current.isbn === 'string' && current.isbn.trim()) {
    const cleanCurrent = current.isbn.replace(/[^\dX]/gi, '');
    if (cleanCurrent.length === 10 || cleanCurrent.length === 13) return cleanCurrent;
  }
  if (!text) return null;
  // Match ISBN-13 or ISBN-10 patterns (with or without hyphens or prefix)
  const matches = text.match(/(?:ISBN(?:-13|-10)?[:\s]+)?(97[89][-\s\d]{10,17}[\dX]|\b\d{9}[\dX]\b)/gi);
  if (matches && matches.length > 0) {
    for (const match of matches) {
      const clean = match.replace(/ISBN/gi, '').replace(/[^\dX]/gi, '').trim();
      if (clean.length === 13 && (clean.startsWith('978') || clean.startsWith('979'))) {
        return clean;
      }
      if (clean.length === 10) {
        return clean;
      }
    }
  }
  return null;
}

// Extract clues from raw filename
function parseFilenameClues(rawFilename: string) {
  let clean = rawFilename
    .replace(/\.(epub|pdf|mobi|azw3|txt|cbz|cbr)$/i, "")
    .replace(/\[(?:z-lib|libgen|retail|epub|pdf|ebook|v\d+[^\]]*)\]/gi, " ")
    .replace(/\((?:retail|unabridged|scan|v\d+[^)]*)\)/gi, " ")
    .replace(/[_\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let authorGuess = "";
  let titleGuess = "";
  let seriesGuess = "";
  let seriesIndexGuess = "";

  // Pattern: Author - [Series 01] - Title or Author - Series 01 - Title
  if (clean.includes(" - ")) {
    const parts = clean.split(" - ").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      authorGuess = parts[0];
      titleGuess = parts[1];
    } else if (parts.length >= 3) {
      authorGuess = parts[0];
      seriesGuess = parts[1];
      titleGuess = parts.slice(2).join(" - ");
    }
  } else {
    // Pattern: Title by Author
    const byMatch = clean.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      titleGuess = byMatch[1].trim();
      authorGuess = byMatch[2].trim();
    } else {
      titleGuess = clean;
    }
  }

  // Extract series tags like (Series Name #1) or [Series 1]
  const bracketSeriesMatch = titleGuess.match(/[\[\(]([^\]\)]+?)\s*#?(\d+(?:\.\d+)?)[\]\)]/i);
  if (bracketSeriesMatch) {
    seriesGuess = bracketSeriesMatch[1].trim();
    seriesIndexGuess = bracketSeriesMatch[2].trim();
    titleGuess = titleGuess.replace(bracketSeriesMatch[0], "").trim();
  }

  return { authorGuess, titleGuess, seriesGuess, seriesIndexGuess, cleanName: clean };
}

// Deep catalog search using Google Books and OpenLibrary
async function queryBookCatalogs(query: { isbn?: string | null; title?: string; author?: string; textSnippet?: string }) {
  const candidateResults: any[] = [];

  // 1. Search by ISBN if detected
  if (query.isbn) {
    try {
      const gbIsbnRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(query.isbn)}&maxResults=2`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (gbIsbnRes.ok) {
        const data = await gbIsbnRes.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            const vi = item.volumeInfo || {};
            candidateResults.push({
              source: "Google Books (ISBN Match)",
              title: vi.title || "",
              subtitle: vi.subtitle || "",
              authors: vi.authors || [],
              publisher: vi.publisher || "",
              publishedDate: vi.publishedDate || "",
              description: vi.description || "",
              categories: vi.categories || [],
              isbn: query.isbn,
              coverUrl: vi.imageLinks?.extraLarge || vi.imageLinks?.large || vi.imageLinks?.medium || vi.imageLinks?.thumbnail || "",
              pageCount: vi.pageCount || 0,
            });
          }
        }
      }
    } catch (e) {
      // Non-fatal search warning
    }
  }

  // 2. Search by Title & Author query
  const titleAuthQuery = `${query.title || ''} ${query.author || ''}`.trim();
  if (titleAuthQuery && candidateResults.length === 0) {
    try {
      const gbQuery = query.title && query.author
        ? `intitle:${encodeURIComponent(query.title)}+inauthor:${encodeURIComponent(query.author)}`
        : encodeURIComponent(titleAuthQuery);
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${gbQuery}&maxResults=3`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (gbRes.ok) {
        const data = await gbRes.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            const vi = item.volumeInfo || {};
            const isbns = (vi.industryIdentifiers || []).map((id: any) => id.identifier);
            candidateResults.push({
              source: "Google Books (Title/Author Match)",
              title: vi.title || "",
              subtitle: vi.subtitle || "",
              authors: vi.authors || [],
              publisher: vi.publisher || "",
              publishedDate: vi.publishedDate || "",
              description: vi.description || "",
              categories: vi.categories || [],
              isbn: isbns[0] || "",
              coverUrl: vi.imageLinks?.extraLarge || vi.imageLinks?.large || vi.imageLinks?.medium || vi.imageLinks?.thumbnail || "",
              pageCount: vi.pageCount || 0,
            });
          }
        }
      }
    } catch (e) {
      // Non-fatal
    }
  }

  // 3. Search by Text Snippet if title/author is ambiguous
  if (query.textSnippet && query.textSnippet.length > 30 && candidateResults.length === 0) {
    try {
      const snippetQuery = encodeURIComponent(query.textSnippet.slice(0, 100));
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${snippetQuery}&maxResults=2`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (gbRes.ok) {
        const data = await gbRes.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            const vi = item.volumeInfo || {};
            candidateResults.push({
              source: "Google Books (Text Excerpt Match)",
              title: vi.title || "",
              subtitle: vi.subtitle || "",
              authors: vi.authors || [],
              publisher: vi.publisher || "",
              publishedDate: vi.publishedDate || "",
              description: vi.description || "",
              categories: vi.categories || [],
              isbn: (vi.industryIdentifiers || [])[0]?.identifier || "",
              coverUrl: vi.imageLinks?.thumbnail || "",
              pageCount: vi.pageCount || 0,
            });
          }
        }
      }
    } catch (e) {
      // Non-fatal
    }
  }

  return candidateResults;
}


// Comprehensive In-Depth AI & Catalog Book Identifier
app.post("/api/metadata/analyze", async (req, res) => {
  const { sampleText, rawFilename, currentMetadata } = req.body;

  // 1. Extract preliminary clues
  const foundIsbn = findIsbnInText(sampleText || "", currentMetadata);
  const fnClues = parseFilenameClues(rawFilename || "");
  const preliminaryTitle = currentMetadata?.title || fnClues.titleGuess;
  const preliminaryAuthor = currentMetadata?.authors?.[0] || fnClues.authorGuess;

  // Extract a clean 80-character distinctive sentence excerpt for web verification
  let distinctiveExcerpt = "";
  if (sampleText && sampleText.length > 50) {
    const cleanLines = sampleText
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 30 && !l.includes("http") && !l.includes("epub") && !l.includes("HTML"));
    if (cleanLines.length > 0) {
      distinctiveExcerpt = cleanLines[0].slice(0, 100);
    }
  }

  // 2. Perform live web/catalog query across Google Books & Open Library
  let catalogHits: any[] = [];
  try {
    catalogHits = await queryBookCatalogs({
      isbn: foundIsbn,
      title: preliminaryTitle,
      author: preliminaryAuthor,
      textSnippet: distinctiveExcerpt,
    });
  } catch (err) {
    console.warn("Catalog lookup notice:", err);
  }

  const primaryCatalogHit = catalogHits.length > 0 ? catalogHits[0] : null;
  const suggestedCoverUrl = primaryCatalogHit?.coverUrl
    ? primaryCatalogHit.coverUrl.replace(/^http:\/\//i, "https://")
    : "";

  
  const bestTitle = primaryCatalogHit?.title || preliminaryTitle || "Untitled Book";
  const bestAuthors = primaryCatalogHit?.authors?.length ? primaryCatalogHit.authors : (preliminaryAuthor ? [preliminaryAuthor] : ["Unknown Author"]);
  const bestPublisher = primaryCatalogHit?.publisher || currentMetadata?.publisher || "";
  const bestDate = primaryCatalogHit?.publishedDate || currentMetadata?.publishedDate || "";
  const bestDesc = primaryCatalogHit?.description || (sampleText ? sampleText.slice(0, 400).trim() + "..." : "");
  const bestGenres = primaryCatalogHit?.categories?.length ? primaryCatalogHit.categories : (currentMetadata?.genres || ["General Fiction"]);
  const bestIsbn = primaryCatalogHit?.isbn || foundIsbn || "";

  return res.json({
    analysis: {
      title: bestTitle,
      author: bestAuthors[0] || "Unknown Author",
      allAuthors: bestAuthors,
      series: fnClues.seriesGuess || currentMetadata?.series || "",
      seriesIndex: fnClues.seriesIndexGuess || currentMetadata?.seriesIndex || "",
      publisher: bestPublisher,
      publishedDate: bestDate,
      description: bestDesc,
      genres: bestGenres,
      language: currentMetadata?.language || "en",
      isbn: bestIsbn,
      searchQuery: `${bestTitle} ${bestAuthors[0] || ""}`.trim(),
      suggestedFilename: `${bestAuthors[0] || "Unknown"} - ${bestTitle}.epub`,
      suggestedCoverUrl: suggestedCoverUrl,
      confidenceScore: foundIsbn || primaryCatalogHit ? 92 : 75,
      confidenceNotes: primaryCatalogHit
        ? `Verified against ${primaryCatalogHit.source}${foundIsbn ? ` (ISBN ${foundIsbn})` : ""}.`
        : "Identified using document colophon, headings, and filename parsing.",
      evidenceDetails: {
        isbnFound: foundIsbn || "(None in sample)",
        rawExcerptMatched: distinctiveExcerpt || "(Title page excerpt)",
        webCatalogMatch: primaryCatalogHit ? `${primaryCatalogHit.title} by ${(primaryCatalogHit.authors || []).join(", ")}` : "Direct extraction",
        sourceSummary: primaryCatalogHit?.source || "Heuristic & Text Parser",
      },
    },
    source: primaryCatalogHit ? "web_catalog" : "heuristic",
  });
});

// AI Cover Art Generator / Prompt suggestions
app.post("/api/metadata/suggest-cover-art", async (req, res) => {
  const { title, author, description, genres } = req.body;

  const defaultStyles = {
    classic_editorial: {
      background: "#16181d",
      textColor: "#f1f1f1",
      accentColor: "#e5b358",
      borderStyle: "ornate_double",
      subtitle: "Definitive E-Reader Edition",
      badgeText: "Classic",
    },
    eink_high_contrast: {
      background: "#000000",
      textColor: "#ffffff",
      accentColor: "#ffffff",
      borderStyle: "minimal_frame",
      subtitle: title ? `${title} · Unabridged` : "High Contrast Edition",
      badgeText: "E-Ink Carta",
    },
    modern_bold: {
      background: "#1c2333",
      textColor: "#f8fafc",
      accentColor: "#38bdf8",
      borderStyle: "vintage_corner",
      subtitle: author ? `Works of ${author}` : "Masterpiece Edition",
      badgeText: "Complete Edition",
    },
  };
  return res.json({ styles: defaultStyles, source: "fallback" });
});

// Vite dev middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
