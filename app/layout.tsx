import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: [ "latin" ],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: [ "latin" ],
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
            className={ `${ geistSans.variable } ${ geistMono.variable } h-full antialiased` }
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col font-sans relative"
                  suppressHydrationWarning>
                <TooltipProvider>
                    <main className="flex-1 relative z-10">{ children }</main>
                </TooltipProvider>
                <Analytics/>
                <SpeedInsights/>
            </body>
        </html>
    );
}
