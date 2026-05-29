'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            KVIZESTEK
          </h1>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/admin"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              isAdmin ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Admin
          </Link>
          <Link
            href="/admin"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
