import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Sparkles, Image as ImageIcon, BookCheck, ExternalLink, Check } from 'lucide-react';
import { SearchBookResult, BookMetadata } from '../types';

interface CoverSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery: string;
  onSelectCoverAndMetadata: (coverUrl: string, metadata?: Partial<BookMetadata>) => void;
}

export const CoverSearchModal: React.FC<CoverSearchModalProps> = ({
  isOpen,
  onClose,
  defaultQuery,
  onSelectCoverAndMetadata,
}) => {
  const [query, setQuery] = useState(defaultQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchBookResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(defaultQuery);
      if (defaultQuery.trim()) {
        performSearch(defaultQuery.trim());
      }
    }
  }, [isOpen, defaultQuery]);

  const performSearch = async (searchQ: string) => {
    if (!searchQ.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      // First try backend proxy endpoint
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQ)}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setIsLoading(false);
        return;
      }
    } catch {
      // Backend not available, continue to client-side fallback
    }

    // Client-side fallback: Direct query to Open Library and Google Books (works statically on GitHub Pages)
    try {
      const cleanQ = encodeURIComponent(searchQ.trim());
      const fallbackResults: SearchBookResult[] = [];

      const [googleRes, olRes] = await Promise.allSettled([
        fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanQ}&maxResults=8`),
        fetch(`https://openlibrary.org/search.json?q=${cleanQ}&limit=8`),
      ]);

      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        const gData = await googleRes.value.json();
        if (gData.items && Array.isArray(gData.items)) {
          for (const item of gData.items) {
            const vi = item.volumeInfo || {};
            let coverUrl =
              vi.imageLinks?.extraLarge ||
              vi.imageLinks?.large ||
              vi.imageLinks?.medium ||
              vi.imageLinks?.thumbnail ||
              vi.imageLinks?.smallThumbnail ||
              '';
            if (coverUrl) {
              coverUrl = coverUrl.replace(/^http:\/\//i, 'https://');
            }
            const isbn13 = vi.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
            const isbn10 = vi.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;

            if (vi.title) {
              fallbackResults.push({
                source: 'Google Books',
                id: `gb_${item.id}`,
                title: vi.title || '',
                authors: vi.authors || [],
                publisher: vi.publisher || '',
                publishedDate: vi.publishedDate || '',
                description: vi.description || '',
                language: vi.language || 'en',
                categories: vi.categories || [],
                pageCount: vi.pageCount || 0,
                isbn: isbn13 || isbn10 || '',
                coverUrl: coverUrl,
              });
            }
          }
        }
      }

      if (olRes.status === 'fulfilled' && olRes.value.ok) {
        const olData = await olRes.value.json();
        if (olData.docs && Array.isArray(olData.docs)) {
          for (const doc of olData.docs) {
            const coverId = doc.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '';
            if (doc.title) {
              const duplicate = fallbackResults.some(
                (r) => r.title.toLowerCase() === doc.title.toLowerCase()
              );
              if (!duplicate) {
                fallbackResults.push({
                  source: 'Open Library',
                  id: `ol_${doc.key || Math.random().toString()}`,
                  title: doc.title || '',
                  authors: doc.author_name || [],
                  publisher: doc.publisher ? doc.publisher[0] : '',
                  publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
                  description: '',
                  language: doc.language ? doc.language[0] : 'en',
                  categories: doc.subject ? doc.subject.slice(0, 5) : [],
                  pageCount: doc.number_of_pages_median || 0,
                  isbn: doc.isbn ? doc.isbn[0] : '',
                  coverUrl: coverUrl,
                });
              }
            }
          }
        }
      }

      setResults(fallbackResults);
    } catch (err: any) {
      console.error('Client book search error:', err);
      setError('Could not fetch book covers. Please check your query or network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111114] rounded-2xl shadow-2xl border border-white/10 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#16161a]">
          <div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              <span>Online Cover & Metadata Finder</span>
            </h3>
            <p className="text-xs text-zinc-400 font-serif">
              Searches Google Books & Open Library for official high-resolution cover art
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-white/10 bg-[#111114]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Title, Author, ISBN or Edition..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500 font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0a0c]">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-medium text-zinc-400 font-sans">
                Scanning global book databases for matching cover art...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs font-sans">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-zinc-500">
              <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs font-medium text-zinc-300 font-sans">
                No cover art found for this query.
              </p>
              <p className="text-[11px] text-zinc-500 font-serif">
                Try searching just the book title and author name without edition tags.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((item) => {
                const proxyCoverUrl = item.coverUrl ? `/api/proxy-cover?url=${encodeURIComponent(item.coverUrl)}` : null;

                return (
                  <div
                    key={item.id}
                    className="bg-[#16161a] rounded-xl border border-white/10 overflow-hidden shadow-2xs hover:border-white/20 transition-all flex flex-col"
                  >
                    {/* Cover Preview Image */}
                    <div className="h-48 bg-[#0a0a0c] relative flex items-center justify-center overflow-hidden group">
                      {item.coverUrl ? (
                        <img
                          src={proxyCoverUrl || item.coverUrl}
                          alt={item.title}
                          className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            if (proxyCoverUrl && e.currentTarget.src !== item.coverUrl) {
                              e.currentTarget.src = item.coverUrl;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px]">No image</span>
                        </div>
                      )}

                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/80 text-white backdrop-blur-xs border border-white/10">
                        {item.source}
                      </span>
                    </div>

                    {/* Book Information */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 font-sans" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-serif truncate mt-0.5">
                          {item.authors.join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                          {item.publishedDate && <span>{item.publishedDate}</span>}
                          {item.publisher && <span className="truncate max-w-[120px]">· {item.publisher}</span>}
                          {item.isbn && <span>· ISBN {item.isbn.slice(-4)}</span>}
                        </div>
                      </div>

                      {/* Apply Actions */}
                      <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={!item.coverUrl}
                          onClick={() => {
                            if (item.coverUrl) {
                              onSelectCoverAndMetadata(item.coverUrl, {
                                title: item.title,
                                authors: item.authors,
                                publisher: item.publisher,
                                publishedDate: item.publishedDate,
                                description: item.description,
                                isbn: item.isbn,
                                genres: item.categories,
                              });
                              onClose();
                            }
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            item.coverUrl
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                              : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          <BookCheck className="w-3.5 h-3.5" />
                          <span>Use Cover & Metadata</span>
                        </button>

                        {item.coverUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCoverAndMetadata(item.coverUrl);
                              onClose();
                            }}
                            className="w-full py-1 px-2 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors text-center"
                          >
                            Apply Cover Only
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
