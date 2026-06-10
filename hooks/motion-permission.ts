// Ez a típusdefiníció "becsapja" a TypeScriptet, hogy ismerje az iOS specifikus funkciót
interface DeviceMotionEventiOS extends DeviceMotionEvent {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
}

export const requestMotionPermission = async (): Promise<boolean> => {
  // Ha szerveroldalon fut (Next.js SSR), azonnal térjen vissza
  if (typeof window === "undefined") return false;

  // iOS 13+ Safari ellenőrzés
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof (DeviceMotionEvent as unknown as DeviceMotionEventiOS)
      .requestPermission === "function"
  ) {
    try {
      // Ezt KÖTELEZŐ egy felhasználói kattintásból hívni!
      const permissionState = await (
        DeviceMotionEvent as unknown as DeviceMotionEventiOS
      ).requestPermission!();

      if (permissionState === "granted") {
        return true;
      } else {
        // alert("A rázáshoz engedélyezned kell az érzékelőt a felugró ablakban!");
        return false;
      }
    } catch (error) {
      // console.error("Hiba történt az engedélykérés során:", error);
      // alert(
      //   "Biztonságos (HTTPS) kapcsolaton kell lenned a szenzorok használatához!",
      // );
      return false;
    }
  }

  // Nem iOS 13+ eszközök (Android, régebbi iPhone, PC) alapból engedik, vagy nem támogatják
  return true;
};
