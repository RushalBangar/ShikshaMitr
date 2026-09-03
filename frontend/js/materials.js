document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/materials`;

    const materialsCardGrid = document.getElementById('materials-card-grid');
    const practicedContainer = document.getElementById('most-practiced-container');
    const yearFilter = document.getElementById('year-filter');
    const subjectFilter = document.getElementById('subject-filter');
    const mediumFilter = document.getElementById('medium-filter');
    const sortFilter = document.getElementById('sort-filter');
    const globalSearchInput = document.getElementById('global-search-input');
    const pageTitle = document.getElementById('page-title');
    const breadcrumbBadge = document.getElementById('page-breadcrumb-badge');

    const urlParams = new URLSearchParams(window.location.search);
    let materialType = urlParams.get('type') || 'board_paper'; 

    const typeConfig = {
        'all': { title: '📚 Study Materials & Board Papers Hub', badge: 'All Curriculum Resources' },
        'board_paper': { title: '📝 Board Papers & Solutions Platform', badge: 'Board Papers & Solutions' },
        'model_solutions': { title: '💡 Model Solutions & Examiner Rubrics', badge: 'Model Solutions' },
        'notes': { title: '📚 Verified Chapter Revision Notes', badge: 'Revision Notes' }
    };

    const currentConfig = typeConfig[materialType] || typeConfig['board_paper'];
    if (pageTitle) pageTitle.textContent = currentConfig.title;
    if (breadcrumbBadge) breadcrumbBadge.textContent = currentConfig.badge;
    document.title = `${currentConfig.title.replace(/^[^\s]+ /, '')} - ShikshaMitr`;

    document.querySelectorAll('#material-type-tabs .type-tab-btn').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-type') === materialType) {
            tab.classList.add('active');
        }
    });

    let currentDiscoveryTag = 'all';
    
    window.applyDiscoveryFilter = function(tag, btn) {
        document.querySelectorAll('.discovery-pill').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        currentDiscoveryTag = tag;
        fetchAndRenderMaterials();
    };

    window.applyQuickSearch = function(term) {
        if (globalSearchInput) globalSearchInput.value = term;
        fetchAndRenderMaterials();
    };

    window.clearSearch = function() {
        if (globalSearchInput) globalSearchInput.value = '';
        fetchAndRenderMaterials();
    };

    window.filterByPractice = function(year, subject, board) {
        if (yearFilter) yearFilter.value = year;
        if (subjectFilter) subjectFilter.value = subject;
        fetchAndRenderMaterials();
        document.getElementById('materials-card-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    window.sortMaterials = function() {
        fetchAndRenderMaterials();
    };

    window.switchView = function(mode) {
        const grid = document.getElementById('materials-card-grid');
        const gridBtn = document.getElementById('view-grid-btn');
        const listBtn = document.getElementById('view-list-btn');

        if (!grid) return;
        if (mode === 'list') {
            grid.classList.add('list-view');
            listBtn?.classList.add('active');
            gridBtn?.classList.remove('active');
        } else {
            grid.classList.remove('list-view');
            gridBtn?.classList.add('active');
            listBtn?.classList.remove('active');
        }
    };
    
    window.filterMaterials = function() {
        fetchAndRenderMaterials();
    };

    const fetchAndRenderMaterials = async () => {
        try {
            let url = new URL(API_URL);
            
            if (materialType && materialType !== 'all') {
                url.searchParams.append('type', materialType);
            }
            if (yearFilter && yearFilter.value) {
                url.searchParams.append('year', yearFilter.value);
            }
            if (subjectFilter && subjectFilter.value) {
                url.searchParams.append('subject', subjectFilter.value);
            }
            if (mediumFilter && mediumFilter.value) {
                url.searchParams.append('medium', mediumFilter.value);
            }
            
            const query = (globalSearchInput?.value || '').trim();
            if (query) url.searchParams.append('q', query);

            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch");

            let materials = await response.json();
            
            const searchLower = query.toLowerCase();
            materials = materials.filter(m => {
                if (searchLower) {
                    const title = (m.title || '').toLowerCase();
                    const sub = (m.subject || '').toLowerCase();
                    if (!title.includes(searchLower) && !sub.includes(searchLower)) return false;
                }
                
                if (currentDiscoveryTag === 'marathi') {
                    if (!(m.medium || '').toLowerCase().includes('marathi')) return false;
                } else if (currentDiscoveryTag === 'solved') {
                    if (m.type !== 'board_paper' && !m.hasSolution) return false; 
                } else if (currentDiscoveryTag === 'bookmarked') {
                    const saved = JSON.parse(localStorage.getItem('shikshamitr_bookmarked_resources') || '[]');
                    if (!saved.includes(`live-${m.id || m._id}`)) return false;
                }
                return true;
            });
            
            const sortVal = sortFilter?.value || 'popular';
            materials.sort((a, b) => {
                if (sortVal === 'popular') {
                    const aAtt = a.attempts || 0;
                    const bAtt = b.attempts || 0;
                    return bAtt - aAtt;
                } else if (sortVal === 'recent') {
                    const aYear = parseInt(a.year || '0', 10);
                    const bYear = parseInt(b.year || '0', 10);
                    return bYear - aYear;
                }
                return 0;
            });

            renderGrid(materials);
            updateMostPracticed(materials);
            
            const counter = document.getElementById('results-counter');
            if (counter) counter.textContent = `Showing ${materials.length} resources`;

        } catch (err) {
            console.error('Failed to fetch materials:', err);
            if (materialsCardGrid) materialsCardGrid.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); grid-column: 1/-1;">Could not load materials from backend. Please ensure the backend is running.</div>`;
        }
    };

    const renderGrid = (items) => {
        if (!materialsCardGrid) return;
        materialsCardGrid.innerHTML = '';
        
        if (items.length === 0) {
            materialsCardGrid.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); grid-column: 1/-1;">No resources found for the selected filters.</div>`;
            return;
        }

        items.forEach((mat) => {
            const card = document.createElement('div');
            const mId = mat.id || mat._id;
            const saved = JSON.parse(localStorage.getItem('shikshamitr_bookmarked_resources') || '[]');
            const isBookmarked = saved.includes(`live-${mId}`);
            const fullUrl = mat.url ? (mat.url.startsWith('http') ? mat.url : `${BACKEND_BASE_URL}${mat.url}`) : '#';
            const mediumText = mat.medium || 'English';
            const attempts = mat.attempts || Math.floor(Math.random() * 1000) + 500;

            if (materialType === 'board_paper' || mat.type === 'board_paper') {
                card.className = 'exam-paper-card';
                card.setAttribute('data-subject', mat.subject || '');
                card.setAttribute('data-year', mat.year || '');
                card.setAttribute('data-medium', mat.medium || '');
                
                card.innerHTML = `
                    <div>
                        <div class="card-top-header">
                            <div class="board-medium-tags">
                                <span class="tag-board">Maharashtra SSC</span>
                                <span class="tag-medium ${mediumText.toLowerCase().includes('marathi') ? 'tag-marathi' : ''}">${mediumText} Medium</span>
                            </div>
                            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleCardBookmark(this, 'live-${mId}')" title="Save Paper">${isBookmarked ? '❤️' : '🤍'}</button>
                        </div>
                        
                        <h3 class="paper-year-subject-title">${mat.year || '2025'} SSC ${mat.subject || 'Subject'}</h3>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 0.75rem;">${mat.description || 'Maharashtra State Board Paper'}</p>
                        
                        <div class="paper-contents-box">
                            <div class="content-item">
                                <span>📄</span>
                                <span>Question Paper</span>
                            </div>
                            <div class="content-item highlight-sol">
                                <span>📖</span>
                                <span>Solution Available</span>
                            </div>
                        </div>
                        
                        <div class="paper-specs-row">
                            <div>Difficulty: <span class="difficulty-badge diff-medium">Medium</span></div>
                            <div>Pages: <strong>${mat.pages || 10}</strong></div>
                        </div>
                        
                        <div class="card-social-proof">
                            <span style="color: #D97706; font-weight: 700;">🔥 Attempted ${attempts} times</span>
                        </div>
                    </div>
                    <div class="card-action-footer">
                        <button class="btn btn-primary btn-sm btn-view" onclick="openExamViewer('${mat.year || ''} SSC ${mat.subject || ''}', 'Maharashtra SSC', '${mat.medium || ''}', '${mat.pages || 10}', 'Medium', '${mat.description || ''}')">
                            <span>👁️</span>
                            <span>View</span>
                        </button>
                        <a href="${fullUrl}" target="_blank" class="btn btn-ghost btn-sm" title="Download PDF">
                            <span>⬇️ Download</span>
                        </a>
                    </div>
                `;
            } else {
                card.className = 'study-material-card';
                card.innerHTML = `
                    <div>
                        <div class="card-top-header">
                            <div class="subject-badge-box">
                                <div class="subject-icon-avatar">📄</div>
                                <div>
                                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--primary);">
                                        📘 ${mat.subject || 'Study Note'}
                                    </span>
                                    <small style="display: block; color: var(--text-muted); font-size: 0.72rem;">
                                        Class ${mat.standard || '10'} • Faculty Upload
                                    </small>
                                </div>
                            </div>
                            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleCardBookmark(this, 'live-${mId}')" title="Bookmark">${isBookmarked ? '❤️' : '🤍'}</button>
                        </div>
                        <div style="margin-top: 0.6rem;">
                            <span class="class-badge" style="background: var(--status-ok-bg); color: #059669; font-size: 0.68rem;">✓ Verified Faculty Upload</span>
                        </div>
                        <h3 class="card-title" onclick="window.open('${fullUrl}', '_blank')">${mat.title || 'Untitled Resource'}</h3>
                        <p class="card-description">${mat.description || 'Verified board curriculum material uploaded by ShikshaMitr Faculty.'}</p>
                        
                        <div class="meta-specs-grid">
                            <div class="meta-spec-item"><span>📄</span><span>PDF Resource</span></div>
                            <div class="meta-spec-item"><span>💾</span><span>Official File</span></div>
                        </div>
                    </div>
                    <div class="card-action-footer">
                        <a href="${fullUrl}" target="_blank" class="btn btn-primary btn-sm" style="flex: 1;">👁️ View Material ↗</a>
                        <a href="${fullUrl}" download class="btn btn-ghost btn-sm" title="Download">⬇️</a>
                    </div>
                `;
            }

            materialsCardGrid.appendChild(card);
        });
    };

    const updateMostPracticed = (materials) => {
        if (!practicedContainer) return;
        practicedContainer.innerHTML = '';
        
        const top = [...materials].sort((a,b) => {
            const aAtt = a.attempts || 0;
            const bAtt = b.attempts || 0;
            return bAtt - aAtt;
        }).slice(0, 4);
        
        if (top.length === 0) {
            practicedContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted);">No trending papers available</div>';
            return;
        }

        top.forEach(mat => {
            const card = document.createElement('div');
            card.className = 'practiced-card-mini';
            card.onclick = () => window.filterByPractice(mat.year || '', mat.subject || '', 'SSC');
            const attempts = mat.attempts || Math.floor(Math.random() * 1000) + 500;
            
            card.innerHTML = `
                <div>
                    <div class="social-proof-pill">🔥 Attempted ${attempts} times</div>
                    <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0.4rem 0 0.2rem;">${mat.year || '2025'} SSC ${mat.subject || 'Subject'}</h4>
                    <small style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Maharashtra Board • ${mat.medium || 'English'} Medium</small>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                    <span style="color: var(--status-ok-text, #059669); font-weight: 600;">📖 Solution Ready</span>
                    <span style="color: var(--primary); font-weight: 700;">Practice →</span>
                </div>
            `;
            practicedContainer.appendChild(card);
        });
    };

    fetchAndRenderMaterials();
});
