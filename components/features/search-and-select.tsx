'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAllMedia, type MediaItem } from '@/services/media-api';

export type { MediaItem };
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Film, Tv, BookOpen, ImageIcon, X, Check } from 'lucide-react';
import Image from 'next/image';

interface SearchAndSelectProps {
  onSelect: (item: MediaItem) => void;
  selectedTitle?: string;
}

export function SearchAndSelect({ onSelect, selectedTitle }: SearchAndSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['media-search', debouncedQuery],
    queryFn: () => searchAllMedia(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const handleSelectItem = useCallback((item: MediaItem) => {
    onSelect(item);
    setOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
  }, [onSelect]);

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

  // Group results by category
  const movieResults = results.filter((r) => r.category === 'movie');
  const tvResults = results.filter((r) => r.category === 'tv');
  const bookResults = results.filter((r) => r.category === 'book');

  const renderItem = (item: MediaItem) => (
    <div
      key={item.id}
      role="button"
      tabIndex={0}
      onClick={() => handleSelectItem(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSelectItem(item);
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

  const renderGroup = (title: string, items: MediaItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <h4 className="mb-1 px-2 text-xs font-medium text-muted-foreground">{title}</h4>
        <div className="flex flex-col">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            className="inline-flex w-full items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-left font-normal hover:bg-muted transition-colors"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">
              {selectedTitle || 'Keresés film, sorozat vagy könyv...'}
            </span>
            {selectedTitle && (
              <Check className="size-4 shrink-0 text-green-600" />
            )}
          </button>
        )}
      />
      <PopoverContent 
        className="w-[400px] p-0" 
        align="start"
      >
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Írj be egy címet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="px-3 pb-3">
            {debouncedQuery.length < 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Írj be legalább 2 karaktert a kereséshez...
              </p>
            )}

            {debouncedQuery.length >= 2 && (isLoading || isFetching) && (
              <div className="flex items-center justify-center py-4">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span className="ml-2 text-sm text-muted-foreground">Keresés...</span>
              </div>
            )}

            {debouncedQuery.length >= 2 && !isLoading && !isFetching && results.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nincs találat a keresésre.
              </p>
            )}

            {debouncedQuery.length >= 2 && !isLoading && !isFetching && results.length > 0 && (
              <>
                {renderGroup('Filmek', movieResults)}
                {renderGroup('Sorozatok', tvResults)}
                {renderGroup('Könyvek', bookResults)}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
