import { NextResponse } from 'next/server';

let accessToken: string | null = null;
let tokenExpiry: number = 0;
const responseCache = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 óra (miliszekundumban)


async function getTwitchToken() {
    // Ellenőrizzük, van-e érvényes token
    if (accessToken && Date.now() < tokenExpiry) {
        console.log('[IGDB Auth] Gyorsítótárazott token használata. Lejárat:', new Date(tokenExpiry).toISOString());
        return accessToken;
    }

    console.log('[IGDB Auth] Új Twitch token igénylése...');
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('[IGDB Auth] Hiányzó TWITCH_CLIENT_ID vagy TWITCH_CLIENT_SECRET a környezeti változók közül!');
        throw new Error('Missing Twitch credentials');
    }

    const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: 'POST' }
    );

    if (!response.ok) {
        const errorData = await response.text();
        console.error('[IGDB Auth] Twitch autentikáció sikertelen:', response.status, errorData);
        throw new Error('Failed to authenticate with Twitch');
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Lejárati idő beállítása (60s biztonsági ráhagyással)
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    console.log('[IGDB Auth] Új token sikeresen lekérve. Érvényes eddig:', new Date(tokenExpiry).toISOString());
    return accessToken;
}

export async function POST(request: Request) {
    const startTime = Date.now();
    try {
        const body = await request.text();

        // 1. ELŐSZÖR ellenőrizzük a cache-t, hogy megspóroljuk a hívást
        const cached = responseCache.get(body);
        if (cached && Date.now() < cached.expiry) {
            console.log('[IGDB Proxy] Válasz kiszolgálása memóriából (Cache hit)');
            return NextResponse.json(cached.data);
        }

        console.log('[IGDB Proxy] Beérkező kérés body:', body);

        const token = await getTwitchToken();
        const clientId = process.env.TWITCH_CLIENT_ID;

        console.log('[IGDB Proxy] Kérés küldése az IGDB API-nak...');
        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': clientId!,
                'Authorization': `Bearer ${token}`
            },
            body: body,
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[IGDB Proxy] IGDB API hiba (${duration}ms):`, response.status, errorText);
            return NextResponse.json(
                { error: 'IGDB API Error', details: errorText },
                { status: response.status }
            );
        }

        // 2. Deklaráljuk és beolvassuk az adatokat
        const data = await response.json();
        console.log(`[IGDB Proxy] Sikeres válasz (${duration}ms). Találatok száma:`, Array.isArray(data) ? data.length : 'N/A');

        // 3. UTÁNA mentjük el a cache-be
        responseCache.set(body, {
            data: data,
            expiry: Date.now() + CACHE_DURATION
        });

        return NextResponse.json(data);
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[IGDB Proxy] Kritikus hiba (${duration}ms):`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
