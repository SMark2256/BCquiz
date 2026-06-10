import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import Head from "next/head";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KVIZESTEK - BarCraft Corvin",
  description:
    "Kvízestek a BarCraft Corvinban. Teszteld a tudásod és szavazz a következő kvízest témákra!",
  alternates: {
    canonical: "https://www.barcraft-corvin.hu",
  },
  other: {
    "preconnect-tmdb":
      '<link rel="preconnect" href="https://image.tmdb.org" crossorigin="anonymous" />',
    "preconnect-igdb":
      '<link rel="preconnect" href="https://images.igdb.com" crossorigin="anonymous" />',
  },
};

// A viewport beállításokat ide tedd külön
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans relative"
        suppressHydrationWarning
      >
        <QueryProvider>
          <TooltipProvider>
            <main className="flex-1 relative z-10">{children}</main>
          </TooltipProvider>
          <Analytics />
          <SpeedInsights />
        </QueryProvider>
      </body>
    </html>
  );
}
