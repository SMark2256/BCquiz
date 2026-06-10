"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { requestMotionPermission } from "@/hooks/motion-permission";

export default function MainLogo() {
  const [isSecret, setIsSecret] = useState<boolean>(false);
  const [clicks, setClicks] = useState<number[]>([]);
  const [clicksEnabled, setClicksEnabled] = useState<boolean>(false);
  const router = useRouter();

  const upKeyTimer = useRef<NodeJS.Timeout | null>(null);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Kattintás logika (3 kattintás 1mp alatt) - MÓDOSÍTVA (async)
  const handleLogoClick = async () => {
    if (isSecret) {
      router.push("/admin"); // Ha már titkos, kattintásra adminra dob
      return;
    }

    const now = Date.now();
    const newClicks = [...clicks, now].filter((time) => now - time < 1000);
    setClicks(newClicks);

    if (newClicks.length === 3) {
      // ÚJ: Engedélykérés a 3. kattintásnál
      const hasPermission = await requestMotionPermission();

      if (hasPermission) {
        setClicksEnabled(true);
      } else {
        setClicks([]); // Visszaállítjuk, ha elutasította
      }
    }
  };

  // 2. 10mp-es visszaállítás (ha isSecret = true)
  useEffect(() => {
    if (isSecret) {
      resetTimer.current = setTimeout(() => {
        setIsSecret(false);
        setClicksEnabled(false);
        setClicks([]);
      }, 10000);
    }
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [isSecret]);

  // 3. PC: Felfelé nyíl 2mp-ig
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && !e.repeat && clicksEnabled && !isSecret) {
        upKeyTimer.current = setTimeout(() => {
          activateSecret();
        }, 2000);
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

  // 4. Mobil: Rázás érzékelése
  useEffect(() => {
    if (!clicksEnabled || isSecret) return;

    let lastUpdate = 0;
    let x = 0,
      y = 0,
      z = 0,
      lastX = 0,
      lastY = 0,
      lastZ = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration; // Itt 'acceleration'-t használunk, nem a gravitációst
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const curTime = Date.now();
      if (curTime - lastUpdate > 100) {
        const diff = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ);
        if (diff > 30) {
          // Érzékenység állítása
          activateSecret();
        }
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
        lastUpdate = curTime;
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [clicksEnabled, isSecret]);

  // Segédfüggvény a titok aktiválására
  const activateSecret = () => {
    setIsSecret(true);
    const audio = new Audio("/Quests_Completed_sound.mp3");
    audio.play().catch(() => {});
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(200);
  };

  const linkHandle = () => {
    if (isSecret) {
      router.push("/admin");
    }
  };

  return (
    <div
      onClick={handleLogoClick}
      className={`${isSecret && "cursor-pointer"} transition-all duration-300`}
    >
      <Image
        src={!isSecret ? "/BarCraft_logo_Corvin.webp" : "/treasure chest.svg"}
        onClick={linkHandle}
        alt="BC Quiz Logo"
        width={385}
        height={336}
        className="header-logo h-48 sm:h-56 pointer-events-none"
        priority
      />
    </div>
  );
}
