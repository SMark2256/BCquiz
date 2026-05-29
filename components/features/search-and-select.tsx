'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAllMedia, type MediaItem } from '@/services/media-api';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Film, Tv, BookOpen, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface SearchAndSelectProps {
  onSelect: (item: MediaItem) => void;
  selectedTitle?: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  // Using a simpler approach with useCallback
  const updateValue = useCallback((newValue: string) => {
    const handler = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
    return () => clearTimeout(handler);
  }, [delay]);

  useState(() => {
    const cleanup = updateValue(value);
    return cleanup;
  });

  return debouncedValue;
}

export function SearchAndSelect({ onSelect, selectedTitle }: SearchAndSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce using setTimeout
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['media-search', debouncedQuery],
    queryFn: () => searchAllMedia(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const handleSelect = (item: MediaItem) => {
    onSelect(item);
    setOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
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

  // Group results by category
  const movieResults = results.filter((r) => r.category === 'movie');
  const tvResults = results.filter((r) => r.category === 'tv');
  const bookResults = results.filter((r) => r.category === 'book');

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left font-normal"
      >
        <Search data-icon="inline-start" />
        {selectedTitle || 'Keresés film, sorozat vagy könyv...'}
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Média keresése"
        description="Keress filmeket, sorozatokat vagy könyveket"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Írj be egy címet..."
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {debouncedQuery.length < 2 && (
              <CommandEmpty>
                Írj be legalább 2 karaktert a kereséshez...
              </CommandEmpty>
            )}

            {debouncedQuery.length >= 2 && (isLoading || isFetching) && (
              <div className="flex items-center justify-center py-6">
                <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span className="ml-2 text-sm text-muted-foreground">Keresés...</span>
              </div>
            )}

            {debouncedQuery.length >= 2 && !isLoading && !isFetching && results.length === 0 && (
              <CommandEmpty>Nincs találat a keresésre.</CommandEmpty>
            )}

            {movieResults.length > 0 && (
              <CommandGroup heading="Filmek">
                {movieResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ImageIcon className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.year && (
                          <span className="text-xs text-muted-foreground">({item.year})</span>
                        )}
                      </div>
                      {item.originalTitle !== item.title && (
                        <span className="text-xs text-muted-foreground">{item.originalTitle}</span>
                      )}
                    </div>
                    <Badge variant="outline" className={getCategoryColor(item.category)}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-1">{item.categoryLabel}</span>
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {tvResults.length > 0 && (
              <CommandGroup heading="Sorozatok">
                {tvResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ImageIcon className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.year && (
                          <span className="text-xs text-muted-foreground">({item.year})</span>
                        )}
                      </div>
                      {item.originalTitle !== item.title && (
                        <span className="text-xs text-muted-foreground">{item.originalTitle}</span>
                      )}
                    </div>
                    <Badge variant="outline" className={getCategoryColor(item.category)}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-1">{item.categoryLabel}</span>
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {bookResults.length > 0 && (
              <CommandGroup heading="Könyvek">
                {bookResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ImageIcon className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.year && (
                          <span className="text-xs text-muted-foreground">({item.year})</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(item.category)}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-1">{item.categoryLabel}</span>
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
