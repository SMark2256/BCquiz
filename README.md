# BC Quiz – BarCraft Corvin Kvízestek

Egy Next.js alapú webalkalmazás a **BarCraft Corvin** kvízestjeinek bemutatására és a látogatói szavazás kezelésére. A
nyilvános felület megjeleníti a közelgő kvízeseteket, és lehetővé teszi a látogatók számára, hogy szavazzanak a
következő kvízest témájára. Egy védett admin felület szolgál a kvízek és a szavazások kezelésére.

---

## Tartalomjegyzék

- [Funkciók](#funkciók)
- [Technológiai stack](#technológiai-stack)
- [Architektúra áttekintés](#architektúra-áttekintés)
- [Projektstruktúra](#projektstruktúra)
- [Adatmodellek](#adatmodellek)
- [Adattárolás: Firebase vs. helyi mock mód](#adattárolás-firebase-vs-helyi-mock-mód)
- [Hitelesítés és jogosultság](#hitelesítés-és-jogosultság)
- [Szavazási rendszer](#szavazási-rendszer)
- [Külső média API-k](#külső-média-api-k)
- [Környezeti változók](#környezeti-változók)
- [Telepítés és futtatás](#telepítés-és-futtatás)
- [Firebase beállítása](#firebase-beállítása)
- [Fejlesztői útmutató](#fejlesztői-útmutató)
- [Felhasználói útmutató](#felhasználói-útmutató)
- [Telepítés Vercelre](#telepítés-vercelre)

---

## Funkciók

### Nyilvános oldal (`/`)

- **Közelgő kvízestek listája** – Aktív, jövőbeli dátumú kvízek megjelenítése kártyák formájában.
- **Élő szavazás** – A látogatók szavazhatnak a következő kvízest témájára. Egyszerre csak egy aktív szavazás futhat.
- **Egyszeri szavazás védelem** – Egy látogató szavazatonként csak egyszer adhat le voksot (
  lásd [Szavazási rendszer](#szavazási-rendszer)).
- **Helyszín- és időpont információk** – Statikus infóblokk a rendezvény részleteivel.
- **Reszponzív felület** – Mobilra optimalizált, animációkkal (Framer Motion).

### Admin felület (`/admin`)

- **Google-fiókos bejelentkezés** – Csak engedélyezett e-mail címmel rendelkező adminok férhetnek hozzá.
- **Kvízek kezelése** – Létrehozás, szerkesztés, törlés, aktiválás/deaktiválás.
- **Szavazások kezelése** – Szavazási session-ök létrehozása, témák (votepool) szerkesztése, aktiválás, szavazatok
  nullázása.
- **Élő eredmények** – A szavazatok aránya és állása valós időben követhető.
- **Média kereső** – Filmek, sorozatok, könyvek és játékok keresése borítóképekkel (TMDb, Google Books, IGDB).
- **QR-kód generátor** – Egyedi QR-kódok generálása és letöltése (pl. a szavazó oldal linkjéhez).
- **Sötét/világos téma** – Admin-specifikus témaváltó villanásmentes (flash-free) betöltéssel.
- **Automatikus kijelentkezés** – 30 perc inaktivitás után a rendszer automatikusan kijelentkeztet.
- **Helyi tárolás jelző** – Vizuális jelzés, ha az alkalmazás mock (localStorage) módban fut.

---

## Technológiai stack

| Kategória              | Technológia                                               |
|------------------------|-----------------------------------------------------------|
| Keretrendszer          | [Next.js 16](https://nextjs.org) (App Router)             |
| UI könyvtár            | React 19                                                  |
| Nyelv                  | TypeScript                                                |
| Stílus                 | Tailwind CSS v4                                           |
| Komponensek            | shadcn/ui + Base UI                                       |
| Adatlekérés / cache    | TanStack Query (React Query) + persist client             |
| Backend / adatbázis    | Firebase (Firestore, Storage, Auth, App Check, Analytics) |
| Biztonság / Botvédelem | Google reCAPTCHA v3 (Firebase App Check providerként)     |
| Animáció               | Framer Motion                                             |
| Diagramok              | Recharts                                                  |
| QR-kód                 | qrcode.react                                              |
| Helyi tárolás          | localforage (visitor ID), localStorage (mock mód)         |
| Analitika              | Vercel Analytics + Speed Insights                         |

---

## Architektúra áttekintés

Az alkalmazás egy **kétszintű architektúrát** követ:

1. **Nyilvános réteg** – Statikusan/kliensoldalon renderelt oldal, amely TanStack Query-n keresztül olvassa az adatokat
   Firestore-ból (vagy mock módban a localStorage-ból).
2. **Admin réteg** – Hitelesítéshez kötött kezelőfelület, amely írási műveleteket végez.

Az adatfolyam egységes szolgáltatási rétegen (`services/`) keresztül zajlik. Minden szolgáltatás automatikusan eldönti,
hogy **Firebase**-t vagy **helyi mock tárolót** használjon a konfiguráció alapján – így a UI kód változatlan marad
mindkét módban.

```
UI komponensek
    │
    ▼
React Query hookok  (hooks/use-*.ts)
    │
    ▼
Szolgáltatási réteg (services/*-service.ts)
    │
    ├──► Firebase (Firestore / Storage / Auth)   ← éles mód
    └──► mock-storage.ts (localStorage)          ← fejlesztői / mock mód
```

---

## Projektstruktúra

```
.
├── app/
│   ├── page.tsx                 # Nyilvános főoldal
│   ├── layout.tsx               # Gyökér layout, fontok, metaadatok, preconnect
│   ├── globals.css              # Globális stílusok és design tokenek
│   ├── admin/
│   │   ├── page.tsx             # Admin felület (tabok: kvízek / szavazás / eszközök)
│   │   └── layout.tsx           # Villanásmentes téma-inicializáló script
│   └── api/
│       └── igdb/route.ts        # IGDB proxy (Twitch token + cache)
│
├── components/
│   ├── features/                # Üzleti komponensek (kártyák, táblák, dialógusok, widgetek)
│   ├── providers/               # QueryProvider, AdminThemeProvider
│   └── ui/                      # shadcn/ui alapkomponensek
│
├── hooks/
│   ├── use-auth.ts              # Google bejelentkezés + admin ellenőrzés + auto-logout
│   ├── use-quizzes.ts           # Kvízek lekérése (React Query)
│   ├── use-voting.ts            # Szavazás logika + visitor ID kezelés
│   ├── use-voting-sessions.ts   # Szavazási session-ök lekérése
│   ├── use-mock-data.ts         # Mock mód státusz és adat-reset
│   └── motion-permission.ts     # Animációs preferencia kezelése
│
├── services/
│   ├── quiz/                    # Kvíz szolgáltatás + Firestore konverter
│   ├── voting/                  # Szavazás szolgáltatás + Firestore konverter
│   ├── media-api.ts             # TMDb / Google Books / IGDB kereső
│   ├── storage-service.ts       # Firebase Storage képfeltöltés
│   └── mock-storage.ts          # localStorage alapú perzisztencia (mock mód)
│
├── lib/
│   ├── firebase.ts              # Firebase inicializálás, App Check, helper-ek
│   └── utils.ts                 # Segédfüggvények (cn, stb.)
│
├── types/
│   └── index.ts                 # Központi TypeScript típusdefiníciók
│
└── public/                      # Statikus assetek (logók, ikonok, hang)
```

---

## Adatmodellek

A központi típusok a `types/index.ts` fájlban találhatók.

### `Quiz` – Kvízest

```ts
interface Quiz {
    id: string;
    title: string;
    titleHu?: string;        // Magyar cím
    description?: string;
    date: Date;
    time: string;            // pl. "20:00"
    imageUrl?: string;
    location?: string;
    category?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### `VotingSession` – Szavazás

Egyszerre **csak egy** session lehet aktív (`isActive`). A `votepool` tartalmazza a választható témákat.

```ts
interface VotingSession {
    id: string;
    title?: string;
    description?: string;
    isActive: boolean;
    votepool: VoteTopic[];
    createdAt: Date;
    updatedAt: Date;
}
```

### `VoteTopic` – Szavazható téma

```ts
interface VoteTopic {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    votes: number;
}
```

### `DbVoteRecord` – Leadott szavazat (Firestore `votes` kollekció)

Az egyediséget a `sessionId_fingerprint` formátumú dokumentum-azonosító garantálja.

```ts
interface DbVoteRecord {
    id: string;              // "{sessionId}_{fingerprint}"
    sessionId: string;
    topicId: string;
    fingerprint: string;     // látogatói azonosító
    timestamp: Date;
}
```

### `ApiResponse<T>` – Egységes válaszformátum

A szolgáltatási réteg minden művelete ezt a típust adja vissza:

```ts
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
```

---

## Adattárolás: Firebase vs. helyi mock mód

Az alkalmazás kétféle adattárolási móddal működhet. A választás automatikus:

```ts
function shouldUseMockStorage(): boolean {
    return isMockMode() || !isFirebaseConfigured();
}
```

- **Éles (Firebase) mód** – Akkor aktív, ha a Firebase környezeti változók be vannak állítva, és a mock mód nincs
  bekapcsolva. Az adatok a Firestore-ban tárolódnak.
- **Mock (helyi) mód** – Akkor aktív, ha `NEXT_PUBLIC_USE_LOCAL_MOCK=true`, **vagy** ha a Firebase nincs konfigurálva.
  Az adatok a böngésző `localStorage`-jában élnek, alapértelmezett demó adatokkal feltöltve. Ez ideális fejlesztéshez és
  teszteléshez Firebase nélkül.

A mock módot az admin felület egy "Helyi tárolás" jelzővel és figyelmeztető sávval mutatja, ahol az adatok
alapértelmezettre is visszaállíthatók.

A `localStorage` kulcsok: `bcquiz_quizzes`, `bcquiz_voting_sessions`, `bcquiz_initialized`.

---

## Hitelesítés és jogosultság

A hitelesítés a `hooks/use-auth.ts` hookban van megvalósítva, Firebase Authentication (Google provider) segítségével.

**Folyamat:**

1. A felhasználó a Google fiókjával jelentkezik be (popup).
2. A rendszer ellenőrzi az e-mail címet a Firestore `settings/config` dokumentum `adminEmails` tömbjében.
3. Ha az e-mail nem szerepel a listában, a rendszer azonnal kijelentkezteti.
4. Sikeres bejelentkezés esetén JWT token érhető el a hitelesített kérésekhez.

**Biztonsági jellemzők:**

- Az admin e-mail lista a Firestore-ban tárolódik, nem a kódban → új admin a kód módosítása nélkül adható hozzá.
- **Automatikus kijelentkezés** 30 perc inaktivitás után (egér, billentyűzet, kattintás, görgetés figyelése).
- A nyilvános szavazáshoz **anonim Firebase hitelesítés** (`ensureAnonymousUser`) használható.

> **Megjegyzés:** A tényleges hozzáférési szabályokat Firestore Security Rules-ban is érdemes kikényszeríteni (
> server-side), a kliensoldali ellenőrzés mellett.

---

## Szavazási rendszer

A szavazás célja, hogy minden látogató **session-önként csak egyszer** szavazhasson, regisztráció nélkül.

**Hogyan működik:**

1. Minden böngészőhöz egyedi **visitor ID** (`crypto.randomUUID()`) generálódik, és `localforage`-ban tárolódik (
   `bcquiz_visitor_id` kulcs).
2. Szavazáskor a `votes` kollekcióba egy dokumentum kerül `{sessionId}_{visitorId}` azonosítóval.
3. A művelet **Firestore tranzakcióban** fut (`runTransaction`):
    - Ellenőrzi, hogy létezik-e már szavazat ezzel az azonosítóval.
    - Ha igen → hibát dob ("Te már szavaztál ebben a témában!").
    - Ha nem → rögzíti a szavazatot **és** atomi módon növeli a témára adott voksok számát.
4. A szavazatok nullázásakor a kapcsolódó `votes` dokumentumok is törlődnek, így újra lehet szavazni.

> A `fingerprint` mező valójában a visitor ID-t tartalmazza. Ez a megoldás megakadályozza a véletlen dupla szavazást, de
> nem nyújt teljes védelmet szándékos visszaélés ellen (pl. localStorage törlése, több böngésző). Erősebb védelemhez
> szerveroldali ellenőrzés / valódi fingerprint szükséges.

---

## Külső média API-k

Az admin média kereső három forrásból egyesít találatokat (`services/media-api.ts`):

| Forrás           | Tartalom          | Hívás módja                                   |
|------------------|-------------------|-----------------------------------------------|
| **TMDb**         | Filmek, sorozatok | Közvetlen kliensoldali hívás                  |
| **Google Books** | Könyvek           | Közvetlen kliensoldali hívás                  |
| **IGDB**         | Videójátékok      | Szerveroldali proxy-n keresztül (`/api/igdb`) |

**IGDB proxy (`app/api/igdb/route.ts`):**

- Az IGDB a Twitch OAuth-ot használja. A proxy szerveroldalon kéri le és **gyorsítótárazza** a Twitch access tokent (
  memóriában, 60s biztonsági ráhagyással a lejárat előtt).
- A lekérdezések válaszai **1 órán át** cache-elve vannak a felesleges hívások elkerülésére.
- A Twitch kliens-azonosító és titok így soha nem kerül a kliens oldalra.

---

## Környezeti változók

Hozz létre egy `.env.local` fájlt a projekt gyökerében. **Soha ne commitold a valós értékeket!**

```bash
# --- Firebase (kötelező éles módhoz) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# --- Firebase App Check (reCAPTCHA v3) ---
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# --- Mock mód kapcsoló (opcionális) ---
# true esetén localStorage-t használ Firebase helyett
NEXT_PUBLIC_USE_LOCAL_MOCK=

# --- Média API-k (opcionális, a kereső funkcióhoz) ---
NEXT_PUBLIC_TMDB_API_KEY=
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=

# --- IGDB / Twitch (szerveroldali, NEM publikus) ---
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

> **Biztonsági figyelmeztetés:** A `TWITCH_CLIENT_SECRET` szerveroldali titok – soha ne tedd `NEXT_PUBLIC_` prefixszel
> elérhetővé. A `NEXT_PUBLIC_` prefixű változók a böngészőbe is bekerülnek.

| Változó                                     | Kötelező?          | Leírás                        |
|---------------------------------------------|--------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_*`                    | Éles módhoz igen   | Firebase projekt konfiguráció |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`            | App Check-hez igen | reCAPTCHA v3 oldal kulcs      |
| `NEXT_PUBLIC_USE_LOCAL_MOCK`                | Nem                | `true` = helyi mock mód       |
| `NEXT_PUBLIC_TMDB_API_KEY`                  | Nem                | Film/sorozat keresés          |
| `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY`          | Nem                | Könyv keresés                 |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Nem                | IGDB (játék) keresés          |

---

## Telepítés és futtatás

**Előfeltétel:** Node.js 18+ és npm.

```bash
# 1. Függőségek telepítése
npm install

# 2. Környezeti változók beállítása
#    (hozd létre a .env.local fájlt a fenti minta alapján)

# 3. Fejlesztői szerver indítása
npm run dev
```

Nyisd meg a [http://localhost:3000](http://localhost:3000) címet a böngészőben.

> Firebase konfiguráció nélkül az alkalmazás automatikusan **mock módba** vált, így azonnal kipróbálható demó adatokkal.

### Elérhető parancsok

| Parancs         | Leírás                                         |
|-----------------|------------------------------------------------|
| `npm run dev`   | Fejlesztői szerver (HMR-rel, `0.0.0.0` hoston) |
| `npm run build` | Éles build készítése                           |
| `npm run start` | Éles build futtatása                           |
| `npm run lint`  | ESLint ellenőrzés                              |

---

## Firebase beállítása

Éles módhoz egy Firebase projektre van szükség a következő szolgáltatásokkal:

1. **Firestore Database** – a következő kollekciókkal:
    - `quizzes` – kvízestek
    - `voting_sessions` – szavazások
    - `votes` – leadott szavazatok (`{sessionId}_{fingerprint}` azonosítóval)
    - `settings/config` – konfigurációs dokumentum egy `adminEmails: string[]` mezővel
2. **Authentication** – Google bejelentkezési provider engedélyezve. Az anonim bejelentkezés is engedélyezhető a
   nyilvános szavazáshoz.
3. **Storage** – képfeltöltéshez (kvíz/téma borítók).
4. **App Check** – reCAPTCHA v3 provider, a háttér API-k védelméhez.

**Admin hozzáadása:** a Firestore `settings/config` dokumentum `adminEmails` tömbjéhez add hozzá az engedélyezett Google
e-mail címeket.

> A javasolt biztonsági gyakorlat szerint a Firestore Security Rules-ban is korlátozd az írási műveleteket az admin
> e-mailekre, a `votes` kollekciónál pedig kényszerítsd ki a dokumentum-azonosító egyediségét.

---

## Fejlesztői útmutató

### Új adatművelet hozzáadása

1. Bővítsd a típusokat a `types/index.ts`-ben.
2. Implementáld a Firebase és a mock logikát a megfelelő szolgáltatásban (`services/`). Tartsd be az `ApiResponse<T>`
   mintát.
3. Készíts (vagy bővíts) egy React Query hookot a `hooks/` mappában.
4. Használd a hookot a komponensben.

### Mock mód fejlesztéshez

A leggyorsabb fejlesztéshez állítsd be: `NEXT_PUBLIC_USE_LOCAL_MOCK=true`. Az adatok a böngészőben tárolódnak, és az
admin felület "Alapértelmezett adatok" gombjával bármikor visszaállíthatók.

### Konvenciók

- **Szolgáltatási réteg minden adatművelethez** – a komponensek soha ne hívják közvetlenül a Firestore-t.
- **Egységes válaszformátum** – minden szolgáltatás `ApiResponse<T>`-t ad vissza.
- **Kliensoldali adatlekérés** – TanStack Query-vel, nem `useEffect`-ben.
- **Reszponzív, mobil-első** design Tailwind segédosztályokkal.

### Hibakeresés

- A Firebase lekérdezések a `trackQuery` segédfüggvényen keresztül futnak, ami egységes hibanaplózást biztosít.
- Az IGDB proxy részletes naplókat ír a token- és cache-eseményekről.

---

## Felhasználói útmutató

### Látogatóknak

1. Nyisd meg a főoldalt – itt láthatók a közelgő kvízestek.
2. Görgess a **Szavazás** szekcióhoz, és válaszd ki a kedvenc témád.
3. Egy eszközről egyszer szavazhatsz.

### Adminoknak

1. Lépj a `/admin` oldalra, és jelentkezz be az engedélyezett Google fiókoddal.
2. **Kvízek** fül – kvízestek létrehozása, szerkesztése, aktiválása. Csak az aktív, jövőbeli kvízek jelennek meg a
   nyilvános oldalon.
3. **Szavazási Témák** fül – szavazás létrehozása és témák hozzáadása (a média keresővel borítóképekkel). Egyszerre csak
   egy szavazás lehet aktív. A szavazatok nullázhatók.
4. **Eszközök** fül – QR-kód generálása és letöltése (pl. a szavazó link kihelyezéséhez a helyszínen).
5. A jobb felső sarokban váltható a téma, illetve kijelentkezhetsz. 30 perc inaktivitás után a rendszer automatikusan
   kiléptet.

---

## Telepítés Vercelre

A projekt Vercelre optimalizált (Analytics és Speed Insights beépítve).

1. Csatlakoztasd a Git repository-t a Vercelhez.
2. Add meg a [környezeti változókat](#környezeti-változók) a Vercel projekt beállításaiban.
3. A Vercel automatikusan buildeli és telepíti az alkalmazást minden push-ra.

---

© 2026 BarCraft Budapest. Minden jog fenntartva.
