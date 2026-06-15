"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAdminSessionDeadline,
  SESSION_WARNING_BEFORE,
  ADMIN_DEADLINE_KEY,
  ADMIN_DEADLINE_EVENT,
} from "@/hooks/use-auth";
import MythicIcon from "@/components/ui/mythic-icon";

// Hátralévő idő formázása "perc:másodperc" alakra.
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Feliratkozik a localStorage-ban tárolt fix munkamenet-lejáratra, és 5 perccel
 * a lejárat előtt figyelmeztető ablakot jelenít meg élő visszaszámlálóval.
 * A munkamenet a bejelentkezéstől számítva fixen 30 percig él (nem inaktivitás
 * alapú). A felhasználó meghosszabbíthatja a munkamenetet, vagy azonnal
 * kijelentkezhet. Ha a 30 perc lejár, a useAuth időzítője automatikusan kilépteti.
 */
export function AdminSessionTimeout({
  onExtend,
  onLogout,
}: {
  onExtend: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const deadlineRef = useRef<number | null>(null);

  // Lejárat követése: induló érték + ugyanazon lap (custom event) és más lapok
  // (storage event) frissítéseinek figyelése.
  useEffect(() => {
    deadlineRef.current = getAdminSessionDeadline();

    const onDeadline = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      deadlineRef.current =
        typeof detail === "number" ? detail : getAdminSessionDeadline();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_DEADLINE_KEY) {
        deadlineRef.current = getAdminSessionDeadline();
      }
    };

    window.addEventListener(ADMIN_DEADLINE_EVENT, onDeadline);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADMIN_DEADLINE_EVENT, onDeadline);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Másodpercenkénti ellenőrzés: kell-e figyelmeztetni és mennyi van hátra.
  useEffect(() => {
    const tick = () => {
      const deadline = deadlineRef.current;
      if (!deadline) {
        setOpen(false);
        return;
      }

      const left = deadline - Date.now();
      if (left <= 0) {
        // A tényleges kiléptetést a useAuth időzítője végzi.
        setOpen(false);
        return;
      }

      if (left <= SESSION_WARNING_BEFORE) {
        setRemaining(left);
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleExtend = () => {
    onExtend();
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent className="min-w-[90vw] sm:min-w-lg">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <MythicIcon>
              <Clock className="text-primary" />
            </MythicIcon>
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-black tracking-normal leading-10">
            Munkamenet hamarosan lejár!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium tracking-normal my-2">
            A munkamenet{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatRemaining(remaining)}
            </span>{" "}
            múlva lejár, és automatikusan kijelentkeztetünk. A
            meghosszabbítással új 30 perces munkamenet indul, és a biztonsági
            token is frissül. Szeretnéd folytatni?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-4">
          <AlertDialogCancel onClick={handleLogout} className="text-base">
            Kijelentkezés most
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtend} className="text-base">
            Munkamenet meghosszabbítása
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
