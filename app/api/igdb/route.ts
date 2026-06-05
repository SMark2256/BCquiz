import { NextResponse } from 'next/server';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

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

        const data = await response.json();
        console.log(`[IGDB Proxy] Sikeres válasz (${duration}ms). Találatok száma:`, Array.isArray(data) ? data.length : 'N/A');

        return NextResponse.json(data);
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[IGDB Proxy] Kritikus hiba (${duration}ms):`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
