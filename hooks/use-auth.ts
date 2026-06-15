"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  auth,
  firestore,
  initAppCheck,
  refreshAppCheckToken,
} from "@/lib/firebase";
import { redirect } from "next/navigation";
import ms from "ms";

// Tartós admin-munkamenet kulcsa. Az adatot localStorage-ban tároljuk, így a
// munkamenet túléli a frissítést (F5) ÉS az oldal/lap bezárását is (a
// sessionStorage ez utóbbit NEM élné túl). A munkamenethez lejárati idő
// tartozik, hogy ne maradjon örökre érvényben.
const ADMIN_SESSION_KEY = "bcquiz_admin_session";
const ADMIN_SESSION_TTL = ms("30minutes"); // 7 nap ezredmásodpercben

type AdminSession = { email: string; expiresAt: number };

// Visszaadja az érvényes (nem lejárt) admin-munkamenetet, vagy null-t.
const getAdminSession = (): AdminSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session?.email || typeof session.expiresAt !== "number") return null;
    if (session.expiresAt <= Date.now()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

// Elmenti / megújítja az admin-munkamenetet friss lejárati idővel.
const saveAdminSession = (email: string | null) => {
  if (typeof window === "undefined" || !email) return;
  try {
    const session: AdminSession = {
      email,
      expiresAt: Date.now() + ADMIN_SESSION_TTL,
    };
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {}
};

// Delete localstorage admin session details
const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
};

// Logged session times
export const ADMIN_DEADLINE_KEY = "bcquiz_admin_session_deadline";
export const SESSION_DURATION = ms("30m"); // 30 minutes
export const SESSION_WARNING_BEFORE = ms("5m"); // 5minutes

// Esemény, amivel ugyanazon a lapon értesítjük a feliratkozókat a lejárat
// frissüléséről / beállításáról (a storage esemény csak más lapokon sül el).
export const ADMIN_DEADLINE_EVENT = "bcquiz-admin-deadline";

// A jelenlegi munkamenet-lejárat kiolvasása localStorage-ból.
export const getAdminSessionDeadline = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_DEADLINE_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
};

const setAdminSessionDeadline = (ts: number) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_DEADLINE_KEY, String(ts));
  } catch {}
};

const clearAdminSessionDeadline = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_DEADLINE_KEY);
  } catch {}
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  // A munkamenet explicit meghosszabbítását végző függvény referenciája.
  // Az inaktivitási effektben állítjuk be, így az ott élő időzítőt is újraindítja.
  const extendRef = useRef<(() => void) | null>(null);

  // Admin jogosultság ellenőrzése a Firestore-ból.
  // Visszatérési érték:
  //   true  -> biztosan admin
  //   false -> biztosan NEM admin (nincs a listán)
  //   "error" -> nem sikerült ellenőrizni (hálózat / App Check / Firestore hiba)
  //              ilyenkor NEM jelentkeztetünk ki, csak később újrapróbáljuk
  const checkAdminStatus = async (
    userEmail: string | null,
  ): Promise<boolean | "error"> => {
    if (!userEmail) return false;

    try {
      await initAppCheck();
      const configRef = doc(firestore, "settings", "config");
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const adminEmails = configSnap.data().adminEmails as string[];
        return adminEmails.includes(userEmail);
      }
      // A dokumentum nem létezik -> nem tudjuk biztosan eldönteni,
      // ne rúgjuk ki a felhasználót emiatt.
      return "error";
    } catch (error) {
      console.error("Hiba az admin ellenőrzésekor:", error);
      return "error";
    }
  };

  // Admin ellenőrzés újrapróbálkozással, hogy a frissítéskori versenyhelyzet
  // (App Check / reCAPTCHA / Firestore még nem áll készen) ne jelentkeztessen ki.
  const checkAdminStatusWithRetry = async (
    userEmail: string | null,
    retries = 3,
  ): Promise<boolean | "error"> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await checkAdminStatus(userEmail);
      if (result !== "error") return result;
      // Várunk egy kicsit, mielőtt újrapróbáljuk (exponenciálisan növekvő).
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    return "error";
  };

  useEffect(() => {
    // 1) AZONNALI HELYREÁLLÍTÁS A MUNKAMENETBŐL.
    // Még mielőtt a Firebase egyáltalán lefuttatná az onAuthStateChanged-et,
    // ha van érvényes tárolt admin-munkamenet, rögtön beengedjük a felhasználót.
    // Így a frissítés / oldalelhagyás után NEM villan fel a kijelentkezett
    // képernyő, és a Firebase pillanatnyi (App Check / token-refresh miatti)
    // null állapota sem dob ki.
    const initialSession = getAdminSession();
    if (initialSession) {
      setIsAdmin(true);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const session = getAdminSession();

      if (!currentUser) {
        // A Firebase épp nem ad élő felhasználót. Ha van érvényes tárolt
        // munkamenet, MEGTARTJUK az admin hozzáférést – a Firebase a háttérben
        // (App Check inicializálása után) újra hitelesít. NEM léptetjük ki.
        if (session) {
          setUser(null);
          setIsAdmin(true);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
        return;
      }

      // OPTIMISTA LÉPÉS: ha ehhez az e-mailhez van érvényes munkamenet,
      // azonnal beengedjük – nem várjuk meg a Firestore/App Check ellenőrzést.
      const optimisticAdmin =
        !!currentUser.email && currentUser.email === session?.email;

      if (optimisticAdmin) {
        setUser(currentUser);
        setIsAdmin(true);
        setLoading(false);
      }

      // Háttérben (vagy ha nincs munkamenet, akkor blokkolva) pontosítjuk.
      const hasAccess = await checkAdminStatusWithRetry(currentUser.email);

      if (hasAccess === true) {
        // Sikeres ellenőrzés – megújítjuk a munkamenet lejáratát.
        saveAdminSession(currentUser.email);
        setUser(currentUser);
        setIsAdmin(true);
      } else if (hasAccess === false) {
        // Csak akkor jelentkeztetünk ki, ha a Firestore EGYÉRTELMŰEN azt mondja,
        // hogy a felhasználó nincs az admin listán.
        clearAdminSession();
        await signOut(auth);
        setUser(null);
        setIsAdmin(false);
      } else {
        // "error": nem sikerült ellenőrizni (átmeneti hiba / versenyhelyzet).
        // NE jelentkeztessünk ki. Ha volt érvényes munkamenet, maradjon admin.
        console.warn(
          "Admin ellenőrzés átmenetileg sikertelen, munkamenet megtartva.",
        );
        if (!optimisticAdmin) {
          // Nincs munkamenet, de van élő Firebase user – óvatosan beengedjük,
          // hogy a frissítés ne dobjon ki; a következő sikeres ellenőrzés pontosít.
          setUser(currentUser);
          setIsAdmin(true);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      initAppCheck();
      const result = await signInWithPopup(auth, provider);
      const hasAccess = await checkAdminStatus(result.user.email);

      if (hasAccess !== true) {
        clearAdminSession();
        await signOut(auth);
        throw new Error("Nincs jogosultságod az admin felülethez.");
      }

      // Sikeres admin bejelentkezés – tartós munkamenetet mentünk, hogy
      // frissítés / oldalelhagyás után is bejelentkezve maradjon a felhasználó.
      saveAdminSession(result.user.email);

      // Friss, fix 30 perces munkamenet-lejárat beállítása a bejelentkezéstől.
      const deadline = Date.now() + SESSION_DURATION;
      setAdminSessionDeadline(deadline);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(ADMIN_DEADLINE_EVENT, { detail: deadline }),
        );
      }

      // JWT Token kinyerése (Profi szinten így kapod meg a tokent a backend hívásokhoz)
      const token = await result.user.getIdToken();
      console.log("JWT Token elérhető a hitelesített kérésekhez.");

      return { user: result.user, token };
    } catch (error: any) {
      console.error("Bejelentkezési hiba:", error.message);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    clearAdminSession();
    clearAdminSessionDeadline();
    await signOut(auth);
    return redirect("/");
  };

  useEffect(() => {
    if (!isAdmin) return;

    let timeoutId: NodeJS.Timeout | undefined;

    // Auto-logout időzítő felfegyverzése egy adott lejárati időpontra.
    // FONTOS: a hátralévő időt a tárolt lejáratból számoljuk, NEM mindig 30
    // percre indítunk – így F5 után a visszaszámlálás folytatódik, nem nullázódik.
    const armTimer = (deadline: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        // A fix 30 perc már lejárt (pl. lap bezárva töltött idő alatt).
        console.log("Munkamenet lejárt, kijelentkeztetés...");
        logout();
        return;
      }
      timeoutId = setTimeout(() => {
        console.log("Munkamenet lejárt, kijelentkeztetés...");
        logout();
      }, remaining);
    };

    // Induló lejárat: ha már van tárolt érték (pl. F5 után), azt használjuk;
    // különben most állítjuk be a fix 30 perces ablakot.
    let deadline = getAdminSessionDeadline();
    if (!deadline) {
      deadline = Date.now() + SESSION_DURATION;
      setAdminSessionDeadline(deadline);
      window.dispatchEvent(
        new CustomEvent(ADMIN_DEADLINE_EVENT, { detail: deadline }),
      );
    }
    armTimer(deadline);

    // Explicit hosszabbítás (a figyelmeztető ablak gombjáról): új fix 30 perces
    // ablak + a reCAPTCHA (App Check) token kényszerített frissítése, mert az
    // legfeljebb 1 órát él.
    extendRef.current = () => {
      const newDeadline = Date.now() + SESSION_DURATION;
      setAdminSessionDeadline(newDeadline);
      window.dispatchEvent(
        new CustomEvent(ADMIN_DEADLINE_EVENT, { detail: newDeadline }),
      );
      refreshAppCheckToken().catch((e) =>
        console.error("App Check token frissítési hiba:", e),
      );
      armTimer(newDeadline);
    };

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      extendRef.current = null;
    };
  }, [isAdmin]);

  // A munkamenet explicit meghosszabbítása (a figyelmeztető ablakból hívva).
  const extendSession = useCallback(() => {
    extendRef.current?.();
  }, []);

  return { user, isAdmin, loading, login, logout, extendSession };
}
