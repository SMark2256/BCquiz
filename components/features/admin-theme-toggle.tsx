'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/components/providers/admin-theme-provider';

export function AdminThemeToggle() {
    const { theme, mounted, toggleTheme } = useAdminTheme();
    // Until mounted, render a stable label so server and client HTML match.
    const isDark = !mounted || theme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={ toggleTheme }
            aria-label={ isDark ? 'Váltás világos módra' : 'Váltás sötét módra' }
            title={ isDark ? 'Világos mód' : 'Sötét mód' }
            className="relative size-8 shrink-0 text-muted-foreground hover:text-foreground sm:size-9"
        >
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"/>
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"/>
            <span className="sr-only">Téma váltása</span>
        </Button>
    );
}
