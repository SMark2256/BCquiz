"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { requestMotionPermission } from "@/hooks/motion-permission";

export default function MainLogo() {
  const [isSecret, setIsSecret] = useState<boolean>(false);
  const [clicks, setClicks] = useState<number[]>([]);
  const [clicksEnabled, setClicksEnabled] = useState<boolean>(false);

  // ÚJ: Külön kezeljük a PC és Mobil lejárati időket
  const [deviceType, setDeviceType] = useState<"pc" | "mobile" | null>(null);

  const router = useRouter();

  const upKeyTimer = useRef<NodeJS.Timeout | null>(null);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);
  const windowTimer = useRef<NodeJS.Timeout | null>(null); // Időzítő az ablak bezárulásához
  const lastShakeTime = useRef<number>(0);
  const lastAcc = useRef<{ x: number; y: number; z: number } | null>(null);

  // Eszköz típusának meghatározása (egyszerűsített módszer)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      setDeviceType(isMobile ? "mobile" : "pc");
    }
  }, []);

  // 1. Kattintás logika (3 kattintás 1mp alatt)
  const handleLogoClick = async () => {
    if (isSecret) {
      router.push("/admin");
      return;
    }

    const now = Date.now();
    const newClicks = [...clicks, now].filter((time) => now - time < 1000);
    setClicks(newClicks);

    if (newClicks.length === 3) {
      const hasPermission = await requestMotionPermission();

      if (hasPermission) {
        setClicksEnabled(true);

        // Ha elindult a clicksEnabled, takarítsuk el az esetleges régi időzítőt
        if (windowTimer.current) clearTimeout(windowTimer.current);

        // Időzítés beállítása az eszköz típusától függően
        // Mobil: 2 másodperc (2000ms), PC: 5 másodperc (5000ms)
        const timeoutDuration = deviceType === "mobile" ? 10000 : 5000;

        // Új ablak nyitásakor nullázzuk az előző gyorsulásértéket.
        lastAcc.current = null;

        windowTimer.current = setTimeout(() => {
          setClicksEnabled(false);
          setClicks([]);
          lastAcc.current = null;
        }, timeoutDuration);
      } else {
        setClicks([]);
      }
    }
  };

  // Segédfüggvény a titok aktiválására
  const activateSecret = () => {
    setIsSecret(true);
    setClicksEnabled(false); // Aktiválás után kikapcsoljuk az ablakot
    if (windowTimer.current) clearTimeout(windowTimer.current);

    const audio = new Audio("/Quests_Completed_sound.mp3");
    audio.play().catch(() => {});
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(200);
  };

  // 2. 10mp-es visszaállítás (ha isSecret = true) -> Ha nem kattintanak rá, visszaáll az eredeti logo
  useEffect(() => {
    if (isSecret) {
      resetTimer.current = setTimeout(() => {
        setIsSecret(false);
        setClicks([]);
      }, 10000);
    }
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [isSecret]);

  // 3. PC: Felfelé nyíl NYOMVA TARTÁSA 1 MÁSODPERCIG (Ha az 5mp-es ablakon belül vagyunk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Csak akkor indul a számláló, ha clicksEnabled ÉS még NEM secret ÉS 1 másodpercig tartja
      if (e.key === "ArrowUp" && !e.repeat && clicksEnabled && !isSecret) {
        upKeyTimer.current = setTimeout(() => {
          activateSecret();
        }, 1000); // 1 másodperc hosszan kell nyomni
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && upKeyTimer.current) {
        clearTimeout(upKeyTimer.current);
        upKeyTimer.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [clicksEnabled, isSecret]);

  // 4. Mobil: Rázás figyelése (Figyelembe veszi a clicksEnabled-et a handleMotion-ben)
  useEffect(() => {
    // Mobil rázás kezelő függvény
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const now = Date.now();

      const prev = lastAcc.current;
      lastAcc.current = { x: acc.x, y: acc.y, z: acc.z };

      // Az első olvasáskor nincs mihez viszonyítani.
      if (!prev) return;

      // Delta (változás) alapú érzékelés: kivonjuk a gravitációt, így iOS-en és
      // Androidon egyaránt megbízhatóan működik, függetlenül az eszköz
      // gyorsulásérték-skálájától.
      const delta =
        Math.abs(acc.x - prev.x) +
        Math.abs(acc.y - prev.y) +
        Math.abs(acc.z - prev.z);

      if (delta > 50) {
        if (now - lastShakeTime.current < 1000) return;
        lastShakeTime.current = now;
        activateSecret();
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [clicksEnabled, isSecret]); // Fontos dependency-k!

  const linkHandle = () => {
    if (isSecret) {
      router.push("/admin");
    }
  };

  return (
    <div
      onClick={handleLogoClick}
      className={`${isSecret ? "cursor-pointer" : ""} transition-all duration-300`}
    >
      <Image
        src={!isSecret ? "/BarCraft_logo_Corvin.webp" : "/treasure chest.svg"}
        onClick={linkHandle}
        alt="BC Quiz Logo"
        width={385}
        height={336}
        className="header-logo h-48 sm:h-56 pointer-events-none"
        priority
        fetchPriority="high"
      />
    </div>
  );
}
