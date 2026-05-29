import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KVIZESTEK - BarCraft Corvin",
  description: "Kvízestek a BarCraft Corvinban. Teszteld a tudásod és szavazz a következő témákra!",
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
    >
    <SpeedInsights/>
      <body className="min-h-full flex flex-col font-sans relative">
      {/*<video*/}
      {/*    className="fixed inset-0 -z-10 h-full w-full object-cover"*/}
      {/*    autoPlay*/}
      {/*    loop*/}
      {/*    muted*/}
      {/*    playsInline*/}
      {/*>*/}
      {/*  <source src="/LoopingBackground.mp4" type="video/mp4" />*/}
      {/*</video>*/}
        <TooltipProvider>
          <main className="flex-1 relative z-10">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
