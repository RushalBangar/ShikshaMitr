document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/materials`;

    const materialsListEl = document.getElementById('materials-list');
    const standardFilter = document.getElementById('standard-filter');
    const subjectFilter = document.getElementById('subject-filter');
    const pageTitle = document.getElementById('page-title');

    // Get type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const materialType = urlParams.get('type') || 'notes';

    // Update page title based on type
    const typeConfig = {
        'board_paper': { title: '📝 10th Board Papers', icon: '📝' },
        'practice_paper': { title: '✍️ Practice Papers', icon: '✍️' },
        'notes': { title: '📚 Study Notes', icon: '📚' }
    };
    const config = typeConfig[materialType] || typeConfig['notes'];
    pageTitle.textContent = config.title;
    document.title = `${config.title.replace(/^[^\s]+ /, '')} - ShikshaMitr`;

    // Highlight correct nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.href.includes(`type=${materialType}`)) {
            link.classList.add('active');
        }
    });

    // Set standard filter to 10 if it's board papers
    if (materialType === 'board_paper') {
        standardFilter.value = '10';
        standardFilter.disabled = true;
    }

    const fetchMaterials = async () => {
        // Show skeleton loading
        materialsListEl.innerHTML = `
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
        `;
        
        let url = new URL(API_URL);
        url.searchParams.append('type', materialType);
        
        if (standardFilter.value) {
            url.searchParams.append('standard', standardFilter.value);
        }
        if (subjectFilter.value) {
            url.searchParams.append('subject', subjectFilter.value);
        }

        let timeoutId;
        
        try {
            // Show cold start message if takes longer than 2.5s
            timeoutId = setTimeout(() => {
                if (materialsListEl.querySelector('.skeleton')) {
                    const messageEl = document.createElement('div');
                    messageEl.style.cssText = 'grid-column: 1 / -1; text-align: center; color: var(--primary); font-size: 0.9rem; padding: 1rem; background: var(--primary-glow); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); animation: fadeIn 0.3s ease-out;';
                    messageEl.innerHTML = '☁️ Waking up the server, please wait a few seconds...';
                    materialsListEl.prepend(messageEl);
                }
            }, 2500);

            const response = await fetch(url);
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error('Failed to fetch materials');
            
            const materials = await response.json();
            renderMaterials(materials);
        } catch (error) {
            console.error('Error fetching materials:', error);
            materialsListEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <h3>No materials available yet</h3>
                    <p>Materials will appear here once they are added to the database.</p>
                </div>
            `;
        }
    };

    const renderMaterials = (materials) => {
        materialsListEl.innerHTML = '';
        
        if (materials.length === 0) {
            materialsListEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <h3>No materials found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            `;
            return;
        }

        materials.forEach((material, index) => {
            const card = document.createElement('div');
            card.className = 'material-item-card';
            card.style.animationDelay = `${index * 0.05}s`;
            card.style.animation = 'fadeInUp 0.4s ease-out both';
            
            const fullUrl = material.url.startsWith('http') ? material.url : `${BACKEND_BASE_URL}${material.url}`;
            
            card.innerHTML = `
                <div class="material-info">
                    <h4>${material.title}</h4>
                    <span class="badge badge-standard">Std ${material.standard}</span>
                    <span class="badge badge-subject">${material.subject}</span>
                </div>
                <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-ghost">View ↗</a>
            `;
            
            materialsListEl.appendChild(card);
        });
    };

    // Event listeners for filters
    standardFilter.addEventListener('change', fetchMaterials);
    subjectFilter.addEventListener('change', fetchMaterials);

    // Initial fetch
    fetchMaterials();
});
