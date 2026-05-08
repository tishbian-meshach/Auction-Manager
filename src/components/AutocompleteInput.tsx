import { useState, useRef, useEffect, useCallback } from 'react';

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    className?: string;
    maxSuggestions?: number;
}

export function AutocompleteInput({
    value,
    onChange,
    suggestions,
    placeholder,
    className = '',
    maxSuggestions = 6,
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [openAbove, setOpenAbove] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Filter suggestions based on input - works with any Unicode characters (English, Tamil, etc.)
    const filtered = value.trim()
        ? suggestions
              .filter((s) => {
                  const query = value.toLowerCase();
                  const item = s.toLowerCase();
                  // Match if the suggestion contains the query string
                  // Also match from the start for more relevant results
                  return item.includes(query) && item !== value.toLowerCase();
              })
              .slice(0, maxSuggestions)
        : [];

    const showSuggestions = isOpen && filtered.length > 0;

    // Calculate position (open above or below)
    const calculatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const dropdownHeight = Math.min(filtered.length, maxSuggestions) * 44 + 8; // approx height per item + padding
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setOpenAbove(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
        }
    }, [filtered.length, maxSuggestions]);

    useEffect(() => {
        if (showSuggestions) {
            calculatePosition();
        }
    }, [showSuggestions, calculatePosition]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlight when filtered list changes
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filtered.length]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && highlightedIndex >= 0) {
            const items = listRef.current.querySelectorAll('li');
            items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    const handleSelect = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filtered.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filtered.length - 1
                );
                break;
            case 'Enter':
                if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
                    e.preventDefault();
                    handleSelect(filtered[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Highlight matching text in suggestion (works with any Unicode/Tamil text)
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const startIndex = lowerText.indexOf(lowerQuery);
        if (startIndex === -1) return text;

        const before = text.slice(0, startIndex);
        const match = text.slice(startIndex, startIndex + query.length);
        const after = text.slice(startIndex + query.length);

        return (
            <>
                {before}
                <span className="text-accent font-semibold">{match}</span>
                {after}
            </>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {showSuggestions && (
                <ul
                    ref={listRef}
                    className={`absolute z-50 left-0 right-0 bg-background-secondary border border-neutral-700 rounded-xl shadow-xl overflow-hidden overflow-y-auto ${
                        openAbove ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                    style={{ maxHeight: '264px' }}
                >
                    {filtered.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            onMouseDown={(e) => {
                                e.preventDefault(); // prevent blur before click
                                handleSelect(suggestion);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                index === highlightedIndex
                                    ? 'bg-accent/15 text-neutral-100'
                                    : 'text-neutral-300 hover:bg-background-tertiary'
                            }`}
                        >
                            {highlightMatch(suggestion, value)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
