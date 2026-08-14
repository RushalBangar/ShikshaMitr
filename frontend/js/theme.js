/**
 * ShikshaMitr Theme Toggle
 * - Respects system preference on first visit
 * - Persists user choice in localStorage
 * - Applies before paint to prevent flash
 * - Supports both top nav and bottom nav toggle buttons
 */
(function () {
    const STORAGE_KEY = 'shikshamitr-theme';

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function updateIcons(theme) {
        const icon = theme === 'dark' ? '☀️' : '🌙';
        const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

        // Top nav toggle
        const topBtn = document.getElementById('theme-toggle-btn');
        if (topBtn) {
            topBtn.textContent = icon;
            topBtn.setAttribute('aria-label', label);
        }

        // Bottom nav toggle
        const bottomBtn = document.getElementById('bottom-theme-toggle');
        if (bottomBtn) {
            const iconSpan = bottomBtn.querySelector('.bnav-icon');
            if (iconSpan) iconSpan.textContent = icon;
            bottomBtn.setAttribute('aria-label', label);
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Update theme-color meta tag for mobile browser chrome
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0F0F1A' : '#F8FAFC';
        }

        updateIcons(theme);
    }

    // Apply immediately (before DOM ready) to prevent flash
    applyTheme(getPreferredTheme());

    // Once DOM is ready, wire up both toggle buttons
    document.addEventListener('DOMContentLoaded', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        updateIcons(current);

        function toggle() {
            const curr = document.documentElement.getAttribute('data-theme') || 'light';
            applyTheme(curr === 'dark' ? 'light' : 'dark');
        }

        const topBtn = document.getElementById('theme-toggle-btn');
        if (topBtn) topBtn.addEventListener('click', toggle);

        const bottomBtn = document.getElementById('bottom-theme-toggle');
        if (bottomBtn) bottomBtn.addEventListener('click', toggle);
    });

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
})();
