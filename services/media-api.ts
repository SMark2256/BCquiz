// Media API service for TMDb and Google Books and IGDB
// Fetches and unifies data from both APIs

export interface MediaItem {
    id: string;
    title: string;
    originalTitle: string;
    imageUrl: string | null;
    category: 'movie' | 'tv' | 'book' | 'game';
    categoryLabel: string;
    year?: string;
    description?: string;
}

interface TMDbSearchResult {
    id: number;
    title?: string; // For movies
    name?: string; // For TV shows
    original_title?: string;
    original_name?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    media_type: 'movie' | 'tv' | 'person';
}

interface TMDbResponse {
    results: TMDbSearchResult[];
}

interface GoogleBookItem {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        publishedDate?: string;
        description?: string;
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };
    };
}

interface GoogleBooksResponse {
    items?: GoogleBookItem[];
}

interface IGDBGame {
    id: number;
    name: string;
    cover?: {
        url: string;
    };
    first_release_date?: number;
    summary?: string;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const IGDB_API_KEY = process.env.NEXT_PUBLIC_IGDB_API_KEY;
const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export async function searchTMDb(query: string): Promise<MediaItem[]> {
    if (!TMDB_API_KEY || !query.trim()) return [];

    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/multi?api_key=${ TMDB_API_KEY }&query=${ encodeURIComponent(query) }&language=hu-HU&page=1`
        );

        if (!response.ok) {
            console.error('[v0] TMDb API error:', response.status);
            return [];
        }

        const data: TMDbResponse = await response.json();

        return data.results
            .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 10)
            .map((item) => ({
                id: `tmdb-${ item.media_type }-${ item.id }`,
                title: item.title || item.name || 'Unknown',
                originalTitle: item.original_title || item.original_name || item.title || item.name || 'Unknown',
                imageUrl: item.poster_path ? `${ TMDB_IMAGE_BASE }${ item.poster_path }` : null,
                category: item.media_type as 'movie' | 'tv',
                categoryLabel: item.media_type === 'movie' ? 'Film' : 'Sorozat',
                year: (item.release_date || item.first_air_date)?.split('-')[0],
                description: item.overview,
            }));
    } catch (error) {
        console.error('[v0] TMDb search error:', error);
        return [];
    }
}

export async function searchGoogleBooks(query: string): Promise<MediaItem[]> {
    if (!GOOGLE_BOOKS_API_KEY || !query.trim()) return [];

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${ encodeURIComponent(query) }&key=${ GOOGLE_BOOKS_API_KEY }&maxResults=10&langRestrict=hu`
        );

        if (!response.ok) {
            console.error('[v0] Google Books API error:', response.status);
            return [];
        }

        const data: GoogleBooksResponse = await response.json();

        if (!data.items) return [];

        return data.items.map((item) => ({
            id: `book-${ item.id }`,
            title: item.volumeInfo.title,
            originalTitle: item.volumeInfo.title,
            imageUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            category: 'book' as const,
            categoryLabel: 'Könyv',
            year: item.volumeInfo.publishedDate?.split('-')[0],
            description: item.volumeInfo.description,
        }));
    } catch (error) {
        console.error('[v0] Google Books search error:', error);
        return [];
    }
}

export async function searchIGDB(query: string): Promise<MediaItem[]> {
    if (!query.trim()) return [];

    try {
        const queryBody = `fields name, cover.url, first_release_date, summary; search "${query.replace(/"/g, '\\"')}"; limit 10;`;

        console.log('Frontend küldött lekérdezés:', queryBody);

        const response = await fetch('/api/igdb', {
            method: 'POST',
            body: queryBody,
        });

        if (!response.ok) {
            console.error('IGDB API hiba:', response.status);
            return [];
        }

        const games: IGDBGame[] = await response.json();

        return games.map((game) => ({
            id: `igdb-${game.id}`,
            title: game.name,
            originalTitle: game.name,
            imageUrl: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
            category: 'game' as const,
            categoryLabel: 'Játék',
            year: game.first_release_date
                ? new Date(game.first_release_date * 1000).getFullYear().toString()
                : undefined,
            description: game.summary,
        }));
    } catch (error) {
        console.error('IGDB search error:', error);
        return [];
    }
}

export async function searchAllMedia(query: string): Promise<MediaItem[]> {
    if (!query.trim()) return [];

    const [ tmdbResults, booksResults, gameResults ] = await Promise.all([
        searchTMDb(query),
        searchGoogleBooks(query),
        searchIGDB(query),
    ]);

    // Combine and sort by relevance (TMDb first, then books)
    return [ ...gameResults, ...tmdbResults, ...booksResults ];
}
