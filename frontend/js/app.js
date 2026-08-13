document.addEventListener('DOMContentLoaded', () => {
    console.log("ShikshaMitr App Initialized");

    // Example of how we might check the backend API status
    // In production, the URL would be dynamic or relative
    const API_URL = 'http://localhost:8000/api/health';
    
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

    // Add event listeners to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feature = e.target.parentElement.querySelector('h3').textContent;
            alert(`Navigating to ${feature}... (Feature coming soon)`);
        });
    });
});
