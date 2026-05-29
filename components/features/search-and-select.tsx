'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAllMedia, type MediaItem } from '@/services/media-api';

export type { MediaItem };
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Film, Tv, BookOpen, ImageIcon, X, Check, Clock, ChevronDown } from 'lucide-react';
import Image from 'next/image';

const RECENT_ITEMS_KEY = 'bcquiz_recent_media_items';
const MAX_RECENT_ITEMS = 10;

// Get recent items from localStorage
function getRecentItems(): MediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save item to recent items in localStorage
function saveToRecentItems(item: MediaItem) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentItems();
    const filtered = recent.filter((r) => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

interface SearchAndSelectProps {
  onSelect: (item: MediaItem) => void;
  selectedTitle?: string;
}

export function SearchAndSelect({ onSelect, selectedTitle }: SearchAndSelectProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentItems, setRecentItems] = useState<MediaItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent items on mount
  useEffect(() => {
    setRecentItems(getRecentItems());
  }, []);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close when clicking outside, but be careful about dialog interactions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside this component
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }
      // Only collapse if clicking outside
      setExpanded(false);
    };

    if (expanded) {
      // Use capture phase to ensure we see the event first
      document.addEventListener('mousedown', handleClickOutside, true);
      return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }
  }, [expanded]);

  const shouldSearch = debouncedQuery.length >= 2;

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['media-search', debouncedQuery],
    queryFn: () => searchAllMedia(debouncedQuery),
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectItem = useCallback((item: MediaItem, event: React.MouseEvent) => {
    // Prevent any event bubbling that could affect parent dialog
    event.preventDefault();
    event.stopPropagation();
    
    saveToRecentItems(item);
    setRecentItems(getRecentItems());
    
    // Call onSelect after a microtask to ensure state updates don't interfere
    requestAnimationFrame(() => {
      onSelect(item);
      setExpanded(false);
      setSearchQuery('');
      setDebouncedQuery('');
    });
  }, [onSelect]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const getCategoryIcon = (category: MediaItem['category']) => {
    switch (category) {
      case 'movie':
        return <Film className="size-4" />;
      case 'tv':
        return <Tv className="size-4" />;
      case 'book':
        return <BookOpen className="size-4" />;
    }
  };

  const getCategoryColor = (category: MediaItem['category']) => {
    switch (category) {
      case 'movie':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'tv':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'book':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const movieResults = results.filter((r) => r.category === 'movie');
  const tvResults = results.filter((r) => r.category === 'tv');
  const bookResults = results.filter((r) => r.category === 'book');

  const renderItem = (item: MediaItem) => (
    <div
      key={item.id}
      role="button"
      tabIndex={0}
      onMouseDown={(e) => handleSelectItem(item, e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleSelectItem(item, e as unknown as React.MouseEvent);
        }
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.year && (
            <span className="shrink-0 text-xs text-muted-foreground">({item.year})</span>
          )}
        </div>
        {item.originalTitle !== item.title && (
          <span className="truncate text-xs text-muted-foreground">{item.originalTitle}</span>
        )}
      </div>
      <Badge variant="outline" className={`shrink-0 text-xs ${getCategoryColor(item.category)}`}>
        {getCategoryIcon(item.category)}
        <span className="ml-1">{item.categoryLabel}</span>
      </Badge>
    </div>
  );

  const renderGroup = (title: string, items: MediaItem[], icon?: React.ReactNode) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <h4 className="mb-1 flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
          {icon}
          {title}
        </h4>
        <div className="flex flex-col">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  const showRecent = !shouldSearch && recentItems.length > 0;
  const showSearchResults = shouldSearch && !isLoading && !isFetching && results.length > 0;
  const showNoResults = shouldSearch && !isLoading && !isFetching && results.length === 0;
  const showLoading = shouldSearch && (isLoading || isFetching);
  const showPrompt = !shouldSearch && recentItems.length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Collapsed trigger */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`inline-flex w-full items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-left font-normal hover:bg-muted transition-colors ${expanded ? 'hidden' : ''}`}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">
          {selectedTitle || 'Keresés film, sorozat vagy könyv...'}
        </span>
        {selectedTitle ? (
          <Check className="size-4 shrink-0 text-green-600" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Expanded search */}
      <div className={`w-full rounded-lg border border-input bg-popover shadow-lg ${expanded ? '' : 'hidden'}`}>
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Írj be egy címet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setExpanded(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto overscroll-contain p-3">
          {showPrompt && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Írj be legalább 2 karaktert a kereséshez...
            </p>
          )}

          {showRecent && (
            renderGroup('Korábban kiválasztott', recentItems, <Clock className="size-3" />)
          )}

          {showLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">Keresés...</span>
            </div>
          )}

          {showNoResults && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nincs találat a keresésre.
            </p>
          )}

          {showSearchResults && (
            <>
              {renderGroup('Filmek', movieResults)}
              {renderGroup('Sorozatok', tvResults)}
              {renderGroup('Könyvek', bookResults)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
