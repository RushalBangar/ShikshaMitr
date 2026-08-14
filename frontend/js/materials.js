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
    const materialType = urlParams.get('type') || 'notes'; // default to notes

    // Update page title based on type
    const typeTitles = {
        'board_paper': '10th Board Papers',
        'practice_paper': 'Practice Papers',
        'notes': 'Study Notes'
    };
    pageTitle.textContent = typeTitles[materialType] || 'Study Materials';

    // Set standard filter to 10 if it's board papers
    if (materialType === 'board_paper') {
        standardFilter.value = '10';
        standardFilter.disabled = true; // Lock it
    }

    const fetchMaterials = async () => {
        materialsListEl.innerHTML = '<p>Loading materials...</p>';
        
        let url = new URL(API_URL);
        url.searchParams.append('type', materialType);
        
        if (standardFilter.value) {
            url.searchParams.append('standard', standardFilter.value);
        }
        if (subjectFilter.value) {
            url.searchParams.append('subject', subjectFilter.value);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch materials');
            
            const materials = await response.json();
            renderMaterials(materials);
        } catch (error) {
            console.error('Error fetching materials:', error);
            materialsListEl.innerHTML = '<p class="error-msg">Failed to load materials. Make sure the backend is running.</p>';
        }
    };

    const renderMaterials = (materials) => {
        materialsListEl.innerHTML = '';
        
        if (materials.length === 0) {
            materialsListEl.innerHTML = '<p>No materials found for the selected filters.</p>';
            return;
        }

        materials.forEach(material => {
            const card = document.createElement('div');
            card.className = 'material-item-card';
            
            card.innerHTML = `
                <div class="material-info">
                    <h4>${material.title}</h4>
                    <span class="badge">Standard: ${material.standard}</span>
                    <span class="badge badge-subject">Subject: ${material.subject}</span>
                </div>
                <a href="${material.url}" target="_blank" class="btn btn-sm">View / Download</a>
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
