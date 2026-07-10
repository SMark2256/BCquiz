import { Phone } from "lucide-react";

export function ContactPhone() {
  return (
    <a
      href="tel:+3613968480"
      className="flex items-center gap-2 rounded-md md:px-2 py-1 transition-colors text-blue-500"
    >
      {/*<Phone className="h-5 w-5 text-emerald-600" />*/}
      <span className="font-normal underline  text-base sm:text-sm">
        +36 1 396 8480
      </span>
    </a>
  );
}
