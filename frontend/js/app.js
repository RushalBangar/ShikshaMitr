document.addEventListener('DOMContentLoaded', () => {
    console.log("ShikshaMitr App Initialized");

    // Determine backend API URL (Local vs Render Production)
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Replace the Render URL below after deploying your backend to Render
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com'; 
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/health`;
    
    const checkApiStatus = async () => {
        const statusSection = document.getElementById('api-status-section');
        const messageEl = document.getElementById('api-message');
        
        statusSection.classList.remove('hidden');

        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            if (response.ok) {
                statusSection.classList.add('status-ok');
                statusSection.classList.remove('status-error');
                let dbStatus = data.db_connected ? "Connected to MongoDB" : "MongoDB disconnected";
                messageEl.textContent = `Backend Status: Online | ${dbStatus}`;
            } else {
                throw new Error('API returned an error');
            }
        } catch (error) {
            statusSection.classList.add('status-error');
            statusSection.classList.remove('status-ok');
            messageEl.textContent = 'Backend Status: Offline (Please start the Python server)';
            console.error('API Health Check Failed:', error);
        }
    };

    // Run health check on load
    checkApiStatus();

    // Event listeners for buttons removed as they are now anchor tags
});
