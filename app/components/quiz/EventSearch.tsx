import { useState, useEffect } from 'react';
import { AutoCompleteCategory, EventSearchResult } from '@/app/lib/validation/types';

interface EventSearchProps {
  category: AutoCompleteCategory;
  onSelect: (event: EventSearchResult) => void;
  onBack: () => void;
}

const placeholders: Record<AutoCompleteCategory, string> = {
  sports: 'e.g., "Lakers vs Celtics" or "Super Bowl 2025"',
  awards: 'e.g., "97th Academy Awards" or "Grammy Awards 2025"',
  tv: 'e.g., "Survivor Season 47" or "The Bachelor finale"',
};

export default function EventSearch({ category, onSelect, onBack }: EventSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auto-complete/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, category }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Search failed');
        }

        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, category]);

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 hover:text-indigo-800 mb-3 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to categories
      </button>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholders[category]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <li key={result.id}>
              <button
                onClick={() => onSelect(result)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm">{result.title}</div>
                {result.date && (
                  <div className="text-xs text-gray-500 mt-0.5">{result.date}</div>
                )}
                <div className="text-xs text-gray-400 mt-0.5 capitalize">
                  Source: {result.source === 'thesportsdb' ? 'TheSportsDB' : 'Wikipedia'}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 3 && !loading && results.length === 0 && !error && (
        <p className="mt-3 text-sm text-gray-500 text-center py-4">
          No results found. Try a different search term.
        </p>
      )}
    </div>
  );
}
