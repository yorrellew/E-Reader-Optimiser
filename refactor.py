import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove GoogleGenAI import
content = re.sub(r'import\s+\{\s*GoogleGenAI,\s*Type\s*\}\s+from\s+"@google/genai";\n', '', content)

# 2. Remove getAI function and aiClient variable
content = re.sub(r'// Lazy GoogleGenAI initialization\nlet aiClient: GoogleGenAI \| null = null;\nfunction getAI\(\): GoogleGenAI \| null \{.*?\n\}\n', '', content, flags=re.DOTALL)

# 3. Remove generateGeminiJson function
content = re.sub(r'// Resilient Gemini JSON generation.*?\nasync function generateGeminiJson\(.*?\n\}\n', '', content, flags=re.DOTALL)

# 4. Refactor /api/gemini/analyze-book
content = content.replace('app.post("/api/gemini/analyze-book"', 'app.post("/api/metadata/analyze"')

# Replace the AI part in /api/metadata/analyze
ai_block_regex = r'const ai = getAI\(\);\s*// If Gemini API is not available, synthesize catalog hits and heuristic parsing\s*if \(\!ai\) \{(.*?)\s*\}\s*// 3\. Perform deep AI synthesis and verification with Gemini\s*try \{.*?\n\s*\}\s*\n\}\);'
replacement = r'''
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
});'''
content = re.sub(ai_block_regex, replacement, content, flags=re.DOTALL)

# 5. Refactor /api/gemini/suggest-cover-art
cover_ai_regex = r'app\.post\("/api/gemini/suggest-cover-art", async \(req, res\) => \{(.*?const defaultStyles = \{.*?\};\n).*?const ai = getAI\(\);.*?res\.json\(\{ styles: defaultStyles, source: "fallback" \}\);\n\s*\}\n\}\);'
cover_replacement = r'app.post("/api/metadata/suggest-cover-art", async (req, res) => {\1  return res.json({ styles: defaultStyles, source: "fallback" });\n});'
content = re.sub(cover_ai_regex, cover_replacement, content, flags=re.DOTALL)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor complete")
