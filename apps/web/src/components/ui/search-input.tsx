'use client';

import { useState, useRef } from 'react';

interface SearchSuggestion {
  symbol: string;
  name: string;
}

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  suggestions?: SearchSuggestion[];
  className?: string;
}

export function SearchInput({ 
  placeholder = "Search symbol or company...", 
  onSearch,
  suggestions,
  className = ''
}: SearchInputProps): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [internalSuggestions, setInternalSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external suggestions if provided, otherwise use internal ones
  const activeSuggestions = suggestions ?? internalSuggestions;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setQuery(value);
    
    // Generate internal suggestions if no external ones provided
    if (!suggestions) {
      if (value.toLowerCase().includes('aapl')) {
        setInternalSuggestions([
          { symbol: 'AAPL', name: 'Apple Inc.' },
          { symbol: 'AAP', name: 'Advance Auto Parts' },
          { symbol: 'APLS', name: 'Apellis Pharmaceuticals' },
        ]);
      } else if (value.length > 0) {
        setInternalSuggestions([
          { symbol: 'MSFT', name: 'Microsoft Corporation' },
          { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        ]);
      } else {
        setInternalSuggestions([]);
      }
    }
    
    setShowSuggestions(value.length > 0 && activeSuggestions.length > 0);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleInputFocus = (): void => {
    if (query.length > 0 && activeSuggestions.length > 0) {
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
      {showSuggestions && activeSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <ul id="suggestions-list" role="listbox" className="menu p-0">
            {activeSuggestions.map((suggestion, index) => (
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
        </div>
      )}
    </div>
  );
}