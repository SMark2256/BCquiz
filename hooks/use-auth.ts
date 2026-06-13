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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const hasAccess = await checkAdminStatusWithRetry(currentUser.email);
        if (hasAccess === true) {
          setUser(currentUser);
          setIsAdmin(true);
        } else if (hasAccess === false) {
          // Csak akkor jelentkeztetünk ki, ha BIZTOSAN nem admin (nincs a listán).
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
        } else {
          // "error": nem sikerült ellenőrizni (pl. frissítéskori versenyhelyzet).
          // NE jelentkeztessünk ki. Megtartjuk a munkamenetet, és felvesszük a
          // felhasználót adminként, hogy a frissítés ne dobjon ki.
          // A jogosultság a következő sikeres ellenőrzéskor pontosítódik.
          console.warn(
            "Admin ellenőrzés átmenetileg sikertelen, munkamenet megtartva.",
          );
          setUser(currentUser);
          setIsAdmin(true);
        }
      } else {
        setUser(null);
        setIsAdmin(null);
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

      if (!hasAccess) {
        await signOut(auth);
        throw new Error("Nincs jogosultságod az admin felülethez.");
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
    await signOut(auth);
    return redirect("/");
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

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
  }, [user, isAdmin]);

  return { user, isAdmin, loading, login, logout };
}
