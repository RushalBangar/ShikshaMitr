import os
import re
import glob

# Top Nav substitutions: completely strip out emoji spans
TOP_NAV_SUB = r'\s*<span class="nav-icon">.*?</span>\s*'

# Clean up button inline styles (gap, display flex) left behind by emoji removal
BTN_STYLE_SUB = r'\s*style="display: flex; gap: 0\.3rem;"'

# Bottom Nav substitutions: map emojis to SVG paths
BOTTOM_NAV_MAP = {
    '??': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    '??': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    '??': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
    '??': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
    '?????': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    '??': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    'dY"s': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bnav-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
}

BNAV_REGEX = r'<span class="bnav-icon">(.*?)</span>'

def fix_bottom_nav(match):
    icon = match.group(1).strip()
    if icon in BOTTOM_NAV_MAP:
        return BOTTOM_NAV_MAP[icon]
    # Fallback to keep it if we don't know it, though we should map all.
    return match.group(0)

html_files = glob.glob('frontend/*.html')
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. Remove Top Nav Emojis
    content = re.sub(TOP_NAV_SUB, '\n                    ', content)
    
    # 2. Fix weird artifact left in buttons
    content = re.sub(BTN_STYLE_SUB, '', content)
    
    # 3. Replace Bottom Nav Emojis with SVGs
    content = re.sub(BNAV_REGEX, fix_bottom_nav, content)

    # 4. Theme Bug: move `<script src="js/theme.js"></script>` higher up in `<head>` to prevent flash
    # If we find it lower in the head, remove it and insert it right after <head>
    if 'js/theme.js' in content:
        content = content.replace('<script src="js/theme.js"></script>\n', '')
        content = content.replace('<script src="js/theme.js"></script>', '')
        content = content.replace('<head>', '<head>\n    <!-- Prevent dark mode flash -->\n    <script src="js/theme.js"></script>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")
