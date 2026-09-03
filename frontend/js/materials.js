document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/materials`;

    const materialsCardGrid = document.getElementById('materials-card-grid');
    const standardFilter = document.getElementById('standard-filter');
    const subjectFilter = document.getElementById('subject-filter');
    const pageTitle = document.getElementById('page-title');
    const breadcrumbBadge = document.getElementById('page-breadcrumb-badge');

    // Parse type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const materialType = urlParams.get('type') || 'notes';

    // Type configuration
    const typeConfig = {
        'all': { title: '📚 Study Materials & Board Papers Hub', badge: 'All Curriculum Resources' },
        'board_paper': { title: '📝 Class 10 Previous Board Papers & Marking', badge: 'Previous Board Papers' },
        'model_solutions': { title: '💡 Model Solutions & Examiner Rubrics', badge: 'Model Solutions' },
        'notes': { title: '📚 Verified Chapter Revision Notes', badge: 'Revision Notes' }
    };

    const currentConfig = typeConfig[materialType] || typeConfig['notes'];
    if (pageTitle) pageTitle.textContent = currentConfig.title;
    if (breadcrumbBadge) breadcrumbBadge.textContent = currentConfig.badge;
    document.title = `${currentConfig.title.replace(/^[^\s]+ /, '')} - ShikshaMitr`;

    // Highlight segmented type tabs
    document.querySelectorAll('#material-type-tabs .type-tab-btn').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-type') === materialType) {
            tab.classList.add('active');
        }
    });

    // If board_paper selected, lock to standard 10
    if (materialType === 'board_paper' && standardFilter) {
        standardFilter.value = '10';
    }

    // Fetch live faculty uploads from backend API
    const fetchLiveMaterials = async () => {
        try {
            let url = new URL(API_URL);
            if (materialType && materialType !== 'all') {
                url.searchParams.append('type', materialType);
            }
            if (standardFilter && standardFilter.value) {
                url.searchParams.append('standard', standardFilter.value);
            }
            if (subjectFilter && subjectFilter.value) {
                url.searchParams.append('subject', subjectFilter.value);
            }

            const response = await fetch(url);
            if (!response.ok) return;

            const liveMaterials = await response.json();
            if (Array.isArray(liveMaterials) && liveMaterials.length > 0) {
                renderLiveMaterials(liveMaterials);
            }
        } catch (err) {
            // Graceful fallback to verified offline cards
            console.log('Using verified NCERT materials catalog.');
        }
    };

    const renderLiveMaterials = (items) => {
        if (!materialsCardGrid) return;

        items.forEach((mat) => {
            // Avoid duplicates
            if (document.getElementById(`live-mat-${mat.id || mat._id}`)) return;

            const card = document.createElement('div');
            card.id = `live-mat-${mat.id || mat._id}`;
            card.className = 'study-material-card';
            card.setAttribute('data-subject', mat.subject || 'General');
            card.setAttribute('data-standard', mat.standard || '10');
            card.setAttribute('data-type', mat.type || 'notes');
            card.setAttribute('data-tag', 'recent');

            const fullUrl = mat.url.startsWith('http') ? mat.url : `${BACKEND_BASE_URL}${mat.url}`;

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
                        <button class="bookmark-btn" onclick="toggleCardBookmark(this, 'live-${mat.id || mat._id}')" title="Bookmark">🤍</button>
                    </div>
                    <div style="margin-top: 0.6rem;">
                        <span class="class-badge" style="background: var(--status-ok-bg); color: #059669; font-size: 0.68rem;">✓ Verified Faculty Upload</span>
                    </div>
                    <h3 class="card-title" onclick="window.open('${fullUrl}', '_blank')">${mat.title}</h3>
                    <p class="card-description">${mat.description || 'Verified board curriculum material uploaded by ShikshaMitr Faculty.'}</p>
                    
                    <div class="meta-specs-grid">
                        <div class="meta-spec-item"><span>📄</span><span>PDF Resource</span></div>
                        <div class="meta-spec-item"><span>💾</span><span>Official File</span></div>
                        <div class="meta-spec-item"><span>🕒</span><span>Recently Added</span></div>
                        <div class="meta-spec-item"><span>👁️</span><span>Live Synced</span></div>
                    </div>
                </div>
                <div class="card-action-footer">
                    <a href="${fullUrl}" target="_blank" class="btn btn-primary btn-sm" style="flex: 1;">👁️ View Material ↗</a>
                    <a href="${fullUrl}" download class="btn btn-ghost btn-sm" title="Download">⬇️</a>
                </div>
            `;

            materialsCardGrid.prepend(card);
        });

        if (typeof filterMaterials === 'function') {
            filterMaterials();
        }
    };

    fetchLiveMaterials();
});
