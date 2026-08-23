import glob
import re

EMPTY_SEARCH = '<span class="empty-icon">??</span>'
EMPTY_INBOX = '<span class="empty-icon">??</span>'

SVG_SEARCH = '<span class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>'
SVG_INBOX = '<span class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg></span>'

for fpath in glob.glob('frontend/js/*.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(EMPTY_SEARCH, SVG_SEARCH)
    content = content.replace(EMPTY_INBOX, SVG_INBOX)
    
    # Check if there are other emojis like ?? or ?? in JS files that we should replace
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replaced emojis in JS files.")
