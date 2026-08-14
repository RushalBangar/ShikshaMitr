/**
 * ShikshaMitr Theme Toggle
 * - Respects system preference on first visit
 * - Persists user choice in localStorage
 * - Applies before paint to prevent flash
 */
(function () {
    const STORAGE_KEY = 'shikshamitr-theme';

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Update toggle button icon if it exists
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    // Apply immediately (before DOM ready) to prevent flash
    applyTheme(getPreferredTheme());

    // Once DOM is ready, wire up the toggle button
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        // Set initial icon
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        toggleBtn.textContent = current === 'dark' ? '☀️' : '🌙';

        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    });

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually chosen
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
})();
