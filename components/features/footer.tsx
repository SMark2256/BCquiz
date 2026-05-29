import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black uppercase tracking-tighter">
              BARCRAFT
            </span>
            <span className="text-sm text-muted-foreground">CORVIN</span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          </nav>
          
          <p className="text-xs text-muted-foreground">
            A foglalás ajánlott.
          </p>
        </div>
      </div>
    </footer>
  );
}
