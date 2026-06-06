// Blocking, render-before-paint theme script for the admin area only.
// Runs synchronously while the HTML is parsed (on full loads / refreshes of
// /admin), applying the persisted theme to <html> BEFORE the first paint so the
// admin never flashes in light mode before settling on the chosen theme.
// On client-side navigation the AdminThemeProvider's layout effect handles it
// (also before paint), so no flash there either. Defaults to dark.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('bcquiz_admin_theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* eslint-disable-next-line react/no-danger */}
            <script dangerouslySetInnerHTML={ { __html: themeInitScript } }/>
            { children }
        </>
    );
}
