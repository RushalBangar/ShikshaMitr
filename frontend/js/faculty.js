document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    
    // UI Elements
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');
    
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    
    const materialForm = document.getElementById('material-form');
    const materialAlert = document.getElementById('material-alert');
    const matSubmitBtn = document.getElementById('mat-submit-btn');
    
    const readingForm = document.getElementById('reading-form');
    const readingAlert = document.getElementById('reading-alert');
    
    // Check if already logged in
    const token = localStorage.getItem('shikshamitr_token');
    if (token) {
        showDashboard();
    }
    
    function showAlert(element, message, type) {
        element.textContent = message;
        element.className = `alert ${type}`;
        element.style.display = 'block';
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
    
    function hideAlert(element) {
        element.style.display = 'none';
    }
    
    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        logoutBtn.style.display = 'block';
    }
    
    function logout() {
        localStorage.removeItem('shikshamitr_token');
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginForm.reset();
        hideAlert(loginAlert);
    }
    
    logoutBtn.addEventListener('click', logout);
    
    // Tabs Logic
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const target = document.getElementById(targetId);
            target.classList.add('active');
            
            if (targetId === 'manage-materials') {
                loadMaterials();
            }
        });
    });
    
    // Login Form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(loginAlert);
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        let timeoutId = setTimeout(() => {
            showAlert(loginAlert, '☁️ Waking up the server, please wait a few seconds...', 'success');
        }, 2500);

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('shikshamitr_token', data.access_token);
                showDashboard();
            } else {
                const error = await response.json();
                showAlert(loginAlert, error.detail || 'Login failed', 'error');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            showAlert(loginAlert, 'Network error. Please try again.', 'error');
        }
    });
    
    // Material Upload Form
    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(materialAlert);
        
        const fileInput = document.getElementById('mat-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert(materialAlert, 'Please select a file to upload.', 'error');
            return;
        }
        
        // 1. Upload the file first
        matSubmitBtn.textContent = 'Uploading file...';
        matSubmitBtn.disabled = true;
        
        let fileUrl = '';
        let uploadTimeoutId = setTimeout(() => {
            showAlert(materialAlert, '☁️ Waking up the server, please wait a few seconds...', 'success');
        }, 2500);

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const currentToken = localStorage.getItem('shikshamitr_token');
            const uploadRes = await fetch(`${BACKEND_BASE_URL}/api/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                },
                body: formData
            });
            clearTimeout(uploadTimeoutId);
            
            if (!uploadRes.ok) {
                if (uploadRes.status === 401) { logout(); return; }
                throw new Error('File upload failed');
            }
            
            const uploadData = await uploadRes.json();
            fileUrl = `${BACKEND_BASE_URL}${uploadData.url}`;
            
        } catch (error) {
            clearTimeout(uploadTimeoutId);
            showAlert(materialAlert, error.message, 'error');
            matSubmitBtn.textContent = 'Upload Material';
            matSubmitBtn.disabled = false;
            return;
        }
        
        // 2. Create the material record
        matSubmitBtn.textContent = 'Saving details...';
        
        const materialData = {
            title: document.getElementById('mat-title').value,
            type: document.getElementById('mat-type').value,
            standard: parseInt(document.getElementById('mat-standard').value),
            subject: document.getElementById('mat-subject').value,
            url: fileUrl
        };
        
        try {
            const currentToken = localStorage.getItem('shikshamitr_token');
            const response = await fetch(`${BACKEND_BASE_URL}/api/materials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(materialData)
            });
            
            if (response.ok) {
                showAlert(materialAlert, 'Material uploaded successfully!', 'success');
                materialForm.reset();
            } else {
                if (response.status === 401) { logout(); return; }
                const error = await response.json();
                showAlert(materialAlert, error.detail || 'Failed to save material details', 'error');
            }
        } catch (error) {
            showAlert(materialAlert, 'Network error. Please try again.', 'error');
        } finally {
            matSubmitBtn.textContent = 'Upload Material';
            matSubmitBtn.disabled = false;
        }
    });
    
    // Reading Lesson Form
    readingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(readingAlert);
        
        const btn = readingForm.querySelector('button[type="submit"]');
        btn.textContent = 'Saving...';
        btn.disabled = true;
        
        const readingData = {
            level: parseInt(document.getElementById('read-level').value),
            word: document.getElementById('read-word').value,
            sentence: document.getElementById('read-sentence').value
        };
        
        try {
            const currentToken = localStorage.getItem('shikshamitr_token');
            const response = await fetch(`${BACKEND_BASE_URL}/api/reading`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(readingData)
            });
            
            if (response.ok) {
                showAlert(readingAlert, 'Reading lesson added successfully!', 'success');
                readingForm.reset();
            } else {
                if (response.status === 401) { logout(); return; }
                const error = await response.json();
                showAlert(readingAlert, error.detail || 'Failed to save lesson', 'error');
            }
        } catch (error) {
            showAlert(readingAlert, 'Network error. Please try again.', 'error');
        } finally {
            btn.textContent = 'Add Reading Lesson';
            btn.disabled = false;
        }
    });

    // Manage Materials Logic
    const manageAlert = document.getElementById('manage-alert');
    const materialsListContainer = document.getElementById('materials-list-container');

    async function loadMaterials() {
        materialsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading materials...</p>';
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/materials`);
            if (!response.ok) throw new Error('Failed to fetch materials');
            
            const materials = await response.json();
            if (materials.length === 0) {
                materialsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No materials found.</p>';
                return;
            }
            
            materialsListContainer.innerHTML = '';
            materials.forEach(mat => {
                const card = document.createElement('div');
                card.style.background = 'var(--bg-glass)';
                card.style.padding = '1rem';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.border = '1px solid var(--border-subtle)';
                card.style.display = 'flex';
                card.style.justifyContent = 'space-between';
                card.style.alignItems = 'center';
                
                const info = document.createElement('div');
                info.innerHTML = `
                    <h3 style="margin-bottom: 0.25rem; font-size: 1.1rem; color: var(--text-primary);">${mat.title}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">${mat.subject} • Class ${mat.standard} • ${mat.type.replace('_', ' ')}</p>
                `;
                
                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '0.5rem';
                
                const materialId = mat._id || mat.id;
                
                const renameBtn = document.createElement('button');
                renameBtn.textContent = 'Rename';
                renameBtn.className = 'btn btn-sm btn-ghost';
                renameBtn.style.border = '1px solid var(--border-subtle)';
                renameBtn.onclick = () => promptRename(materialId, mat.title);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'btn btn-sm';
                deleteBtn.style.background = 'var(--status-error-bg)';
                deleteBtn.style.color = 'var(--status-error-text)';
                deleteBtn.onclick = () => deleteMaterial(materialId);
                
                actions.appendChild(renameBtn);
                actions.appendChild(deleteBtn);
                
                card.appendChild(info);
                card.appendChild(actions);
                materialsListContainer.appendChild(card);
            });
        } catch (error) {
            materialsListContainer.innerHTML = '<p style="text-align: center; color: var(--status-error-text);">Failed to load materials.</p>';
        }
    }

    async function promptRename(id, oldTitle) {
        const newTitle = prompt("Enter new title:", oldTitle);
        if (!newTitle || newTitle === oldTitle) return;
        
        try {
            const currentToken = localStorage.getItem('shikshamitr_token');
            const response = await fetch(`${BACKEND_BASE_URL}/api/materials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ title: newTitle })
            });
            
            if (response.ok) {
                showAlert(manageAlert, 'Material renamed successfully!', 'success');
                loadMaterials();
            } else {
                if (response.status === 401) { logout(); return; }
                const err = await response.json();
                showAlert(manageAlert, err.detail || 'Failed to rename material', 'error');
            }
        } catch (error) {
            showAlert(manageAlert, 'Network error. Please try again.', 'error');
        }
    }

    async function deleteMaterial(id) {
        if (!confirm("Are you sure you want to delete this material? This cannot be undone.")) return;
        
        try {
            const currentToken = localStorage.getItem('shikshamitr_token');
            const response = await fetch(`${BACKEND_BASE_URL}/api/materials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            
            if (response.ok) {
                showAlert(manageAlert, 'Material deleted successfully!', 'success');
                loadMaterials();
            } else {
                if (response.status === 401) { logout(); return; }
                const err = await response.json();
                showAlert(manageAlert, err.detail || 'Failed to delete material', 'error');
            }
        } catch (error) {
            showAlert(manageAlert, 'Network error. Please try again.', 'error');
        }
    }

    // ==========================================
    // Faculty Quiz Builder Logic
    // ==========================================
    const quizForm = document.getElementById('faculty-quiz-form');
    const quizAlert = document.getElementById('quiz-alert');
    const quizQuestionsBuilder = document.getElementById('quiz-questions-builder');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const saveQuizBtn = document.getElementById('save-quiz-btn');

    let questionCount = 0;

    function addQuestionBlock() {
        questionCount++;
        const qId = questionCount;
        const card = document.createElement('div');
        card.className = 'question-builder-card';
        card.id = `q-card-${qId}`;
        card.style.cssText = `
            background: var(--bg-glass);
            border: 1px solid var(--border-card);
            border-radius: var(--radius-md);
            padding: 1.25rem;
            position: relative;
        `;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                <h5 style="margin: 0; font-size: 0.95rem; color: var(--primary);">Question ${qId}</h5>
                ${qId > 1 ? `<button type="button" style="background: none; border: none; color: var(--status-error-text); cursor: pointer; font-size: 0.85rem;" onclick="document.getElementById('q-card-${qId}').remove()">✕ Remove</button>` : ''}
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <input type="text" class="form-control q-title-input" placeholder="Type question prompt here..." required>
            </div>

            <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">Options (Select radio button for the CORRECT answer):</p>

            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${[0, 1, 2, 3].map(i => `
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <input type="radio" name="correct-opt-${qId}" value="${i}" ${i === 0 ? 'checked' : ''} style="cursor: pointer;">
                        <input type="text" class="form-control q-opt-input" placeholder="Option ${String.fromCharCode(65 + i)}" required style="padding: 0.5rem 0.8rem; font-size: 0.9rem;">
                    </div>
                `).join('')}
            </div>

            <div class="form-group" style="margin-top: 0.8rem; margin-bottom: 0;">
                <input type="text" class="form-control q-exp-input" placeholder="Optional explanation (e.g. formula used)">
            </div>
        `;

        quizQuestionsBuilder.appendChild(card);
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestionBlock);
        // Add initial 2 questions
        addQuestionBlock();
        addQuestionBlock();
    }

    if (quizForm) {
        quizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(quizAlert);

            const title = document.getElementById('quiz-title').value.trim();
            const standard = parseInt(document.getElementById('quiz-standard').value);
            const subject = document.getElementById('quiz-subject').value.trim();

            const questionCards = quizQuestionsBuilder.querySelectorAll('.question-builder-card');
            if (questionCards.length === 0) {
                showAlert(quizAlert, 'Please add at least one question.', 'error');
                return;
            }

            const questions = [];
            for (const card of questionCards) {
                const qText = card.querySelector('.q-title-input').value.trim();
                const optInputs = card.querySelectorAll('.q-opt-input');
                const options = Array.from(optInputs).map(inp => inp.value.trim());
                const correctOptRadio = card.querySelector('input[type="radio"]:checked');
                const correctOption = correctOptRadio ? parseInt(correctOptRadio.value) : 0;
                const expText = card.querySelector('.q-exp-input').value.trim() || null;

                questions.push({
                    question: qText,
                    options: options,
                    correct_option: correctOption,
                    explanation: expText
                });
            }

            if (saveQuizBtn) {
                saveQuizBtn.textContent = 'Publishing Quiz...';
                saveQuizBtn.disabled = true;
            }

            try {
                const currentToken = localStorage.getItem('shikshamitr_token');
                const response = await fetch(`${BACKEND_BASE_URL}/api/quizzes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({
                        title: title,
                        standard: standard,
                        subject: subject,
                        questions: questions
                    })
                });

                if (response.ok) {
                    showAlert(quizAlert, '🎉 Quiz published successfully & broadcast live to all students!', 'success');
                    quizForm.reset();
                    quizQuestionsBuilder.innerHTML = '';
                    questionCount = 0;
                    addQuestionBlock();
                    addQuestionBlock();
                } else {
                    if (response.status === 401) { logout(); return; }
                    const err = await response.json();
                    showAlert(quizAlert, err.detail || 'Failed to create quiz', 'error');
                }
            } catch (err) {
                showAlert(quizAlert, 'Network error. Please try again.', 'error');
            } finally {
                if (saveQuizBtn) {
                    saveQuizBtn.textContent = 'Publish Quiz (Live Broadcast) 🚀';
                    saveQuizBtn.disabled = false;
                }
            }
        });
    }
});
