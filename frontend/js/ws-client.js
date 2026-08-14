// Real-time WebSocket Client for ShikshaMitr Broadcast Notifications
(function () {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const WS_URL = IS_LOCAL ? 'ws://localhost:8000/ws/notifications' : 'wss://shikshamitr.onrender.com/ws/notifications';

    let socket = null;
    let pingInterval = null;

    function showLiveToast(title, message, icon = '📢') {
        let toastContainer = document.getElementById('live-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'live-toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 360px;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: var(--bg-card, #ffffff);
            color: var(--text-primary, #0f172a);
            border: 1px solid var(--border-card, rgba(0,0,0,0.1));
            border-left: 4px solid var(--primary, #6366F1);
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            pointer-events: auto;
            animation: slideInRight 0.4s ease-out;
            font-family: 'Outfit', sans-serif;
        `;

        toast.innerHTML = `
            <span style="font-size: 1.5rem; line-height: 1;">${icon}</span>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 3px 0; font-size: 0.95rem; font-weight: 700;">${title}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary, #475569); line-height: 1.4;">${message}</p>
            </div>
            <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted, #94a3b8); padding: 0;" aria-label="Close">×</button>
        `;

        const closeBtn = toast.querySelector('button');
        closeBtn.onclick = () => {
            toast.remove();
        };

        toastContainer.appendChild(toast);

        // Auto remove after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                toast.style.transition = 'all 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }
        }, 6000);
    }

    function connectWebSocket() {
        try {
            socket = new WebSocket(WS_URL);

            socket.onopen = () => {
                // Keepalive heartbeat every 25 seconds
                clearInterval(pingInterval);
                pingInterval = setInterval(() => {
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send('ping');
                    }
                }, 25000);
            };

            socket.onmessage = (event) => {
                if (event.data === 'pong') return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEW_MATERIAL') {
                        showLiveToast('New Study Material! 📚', data.message, '📚');
                    } else if (data.type === 'NEW_QUIZ') {
                        showLiveToast('New Quiz Published! 🎯', data.message, '🎯');
                    } else if (data.message) {
                        showLiveToast('Live Update 📢', data.message, '✨');
                    }
                } catch (e) {}
            };

            socket.onclose = () => {
                clearInterval(pingInterval);
                // Reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000);
            };

            socket.onerror = () => {
                socket.close();
            };
        } catch (err) {
            // Silently fallback
        }
    }

    // Connect on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectWebSocket);
    } else {
        connectWebSocket();
    }
})();
