'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
} from 'react';

type AdminTheme = 'dark' | 'light';

const STORAGE_KEY = 'bcquiz_admin_theme';
const DEFAULT_THEME: AdminTheme = 'dark';

interface AdminThemeContextValue {
    theme: AdminTheme;
    mounted: boolean;
    setTheme: (theme: AdminTheme) => void;
    toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function readStoredTheme(): AdminTheme {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
}

/**
 * Route-scoped theme provider for the admin area only.
 *
 * Why not next-themes / a global provider?
 * The public site is intentionally locked to a single (dark looking) palette
 * built on the light `:root` tokens + a fixed gradient background. We must not
 * let the admin toggle leak onto it. Since admin and the homepage are separate
 * routes, we apply the `dark` class to <html> ONLY while the admin tree is
 * mounted, and fully restore the previous state on unmount. Toggling the class
 * on <html> (rather than a wrapper div) also ensures Radix portals
 * (dropdowns, dialogs, selects) — which render on document.body — inherit the
 * same theme.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    // Always start from the default so server and first client paint agree
    // (no hydration mismatch). The stored preference is applied right after
    // mount in the layout effect below, before the browser paints.
    const [ theme, setThemeState ] = useState<AdminTheme>(DEFAULT_THEME);
    const [ mounted, setMounted ] = useState(false);

    // On mount, adopt the persisted preference (runs only on the client).
    useLayoutEffect(() => {
        setThemeState(readStoredTheme());
        setMounted(true);
    }, []);

    // Apply/remove the `dark` class on <html> for the lifetime of the admin tree.
    useLayoutEffect(() => {
        const root = document.documentElement;
        const hadDark = root.classList.contains('dark');

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        return () => {
            // Restore the pre-admin state so the public site is untouched.
            if (hadDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };
    }, [ theme ]);

    // Keep the choice in sync across tabs.
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
                setThemeState(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setTheme = useCallback((next: AdminTheme) => {
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            window.localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    return (
        <AdminThemeContext.Provider value={ { theme, mounted, setTheme, toggleTheme } }>
            { children }
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const ctx = useContext(AdminThemeContext);
    if (!ctx) {
        throw new Error('useAdminTheme must be used within an AdminThemeProvider');
    }
    return ctx;
}
