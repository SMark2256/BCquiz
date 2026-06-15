"use client";

import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore, initAppCheck } from "@/lib/firebase";
import { redirect } from "next/navigation";

// Tartós admin-munkamenet kulcsa. Az adatot localStorage-ban tároljuk, így a
// munkamenet túléli a frissítést (F5) ÉS az oldal/lap bezárását is (a
// sessionStorage ez utóbbit NEM élné túl). A munkamenethez lejárati idő
// tartozik, hogy ne maradjon örökre érvényben.
const ADMIN_SESSION_KEY = "bcquiz_admin_session";
const ADMIN_SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 nap ezredmásodpercben

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

// Törli az admin-munkamenetet (kijelentkezéskor vagy egyértelmű elutasításkor).
const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
    await signOut(auth);
    return redirect("/");
  };

  useEffect(() => {
    if (!isAdmin) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 perc ezredmásodpercben
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Inaktivitás miatt kijelentkeztetés...");
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Események figyelése az aktivitáshoz
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer(); // Időzítő indítása

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [isAdmin]);

  return { user, isAdmin, loading, login, logout };
}
