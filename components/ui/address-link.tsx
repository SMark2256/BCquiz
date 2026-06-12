import { MapPin } from "lucide-react";

export default function AddressLink({ address }: { address: string }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-blue-600 transition-colors text-card text-lg font-black tracking-tight sm:text-xl"
    >
      <MapPin className="h-5 w-5 text-card" />
      <span>{address}</span>
    </a>
  );
}
