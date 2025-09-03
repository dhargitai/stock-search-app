'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SearchSuggestion {
  symbol: string;
  name: string;
}

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SearchInput({ 
  placeholder = "Search symbol or company...", 
  onSearch,
  className = ''
}: SearchInputProps): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce the query to avoid too many API calls
  const debouncedQuery = useDebounce(query, 300);

  // Use tRPC query for fetching suggestions
  const {
    data: suggestions = [],
    isLoading,
    isError,
    error,
  } = api.stock.search.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setQuery(value);
    
    setShowSuggestions(value.length > 0);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleInputFocus = (): void => {
    if (query.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (): void => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion): void => {
    setQuery(suggestion.symbol);
    setShowSuggestions(false);
    
    // Navigate to the stock detail page
    router.push(`/${encodeURIComponent(suggestion.symbol)}` as any);
    
    if (onSearch) {
      onSearch(suggestion.symbol);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      <div className="form-control">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="input input-bordered w-full pr-12"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            aria-label="Stock search input"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-controls={showSuggestions ? "suggestions-list" : undefined}
            role="combobox"
          />
          <button
            className="btn btn-square btn-primary"
            aria-label="Search"
            type="button"
            onClick={() => onSearch && onSearch(query)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span className="text-base-content/70">Searching...</span>
            </div>
          )}
          
          {isError && (
            <div className="p-4 text-center text-error">
              <span className="text-sm">
                {error?.message || 'Failed to load suggestions. Please try again.'}
              </span>
            </div>
          )}
          
          {!isLoading && !isError && suggestions.length === 0 && debouncedQuery.length > 0 && (
            <div className="p-4 text-center text-base-content/70">
              <span className="text-sm">No matching stocks found.</span>
            </div>
          )}
          
          {!isLoading && !isError && suggestions.length > 0 && (
            <ul id="suggestions-list" role="listbox" className="menu p-0">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.symbol}-${index}`}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-base-200 focus:bg-base-200 border-b border-base-300 last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-selected={false}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {suggestion.name} ({suggestion.symbol})
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}