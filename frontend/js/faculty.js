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
            const target = document.getElementById(tab.getAttribute('data-target'));
            target.classList.add('active');
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
        
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('shikshamitr_token', data.access_token);
                showDashboard();
            } else {
                const error = await response.json();
                showAlert(loginAlert, error.detail || 'Login failed', 'error');
            }
        } catch (error) {
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
            
            if (!uploadRes.ok) {
                if (uploadRes.status === 401) { logout(); return; }
                throw new Error('File upload failed');
            }
            
            const uploadData = await uploadRes.json();
            fileUrl = `${BACKEND_BASE_URL}${uploadData.url}`;
            
        } catch (error) {
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
});
