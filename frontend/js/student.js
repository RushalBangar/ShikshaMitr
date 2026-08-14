document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;

    // Elements on Student Login / Register page
    const loginForm = document.getElementById('student-login-form');
    const registerForm = document.getElementById('student-register-form');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const authAlert = document.getElementById('auth-alert');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const regSubmitBtn = document.getElementById('reg-submit-btn');

    // Elements on Student Dashboard
    const studentNameEl = document.getElementById('student-name');
    const studentUsernameEl = document.getElementById('student-username');
    const streakCountEl = document.getElementById('streak-count');
    const logoutBtn = document.getElementById('student-logout-btn');

    function showAlert(message, type) {
        if (!authAlert) return;
        authAlert.textContent = message;
        authAlert.className = `alert ${type}`;
        authAlert.style.display = 'block';
    }

    function hideAlert() {
        if (!authAlert) return;
        authAlert.style.display = 'none';
    }

    // Tab Switching
    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            hideAlert();
        });

        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            hideAlert();
        });
    }

    // Auto-redirect if already logged in on login page
    const token = localStorage.getItem('shikshamitr_student_token');
    if (token && window.location.pathname.includes('student-login.html')) {
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Auto-redirect if not logged in on dashboard page
    if (!token && window.location.pathname.includes('student-dashboard.html')) {
        window.location.href = 'student-login.html';
        return;
    }

    // Calculate & Update Daily Streak
    function updateStreak() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('shikshamitr_last_visit');
        let currentStreak = parseInt(localStorage.getItem('shikshamitr_streak') || '1');

        if (!lastVisit) {
            currentStreak = 1;
        } else if (lastVisit !== today) {
            const lastDate = new Date(lastVisit);
            const diffDays = Math.round((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak += 1;
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
        }

        localStorage.setItem('shikshamitr_last_visit', today);
        localStorage.setItem('shikshamitr_streak', currentStreak.toString());
        return currentStreak;
    }

    // Populate Dashboard info
    if (window.location.pathname.includes('student-dashboard.html')) {
        const studentInfoStr = localStorage.getItem('shikshamitr_student_user');
        const studentInfo = studentInfoStr ? JSON.parse(studentInfoStr) : null;

        if (studentInfo) {
            if (studentNameEl) studentNameEl.textContent = studentInfo.full_name || studentInfo.username;
            if (studentUsernameEl) studentUsernameEl.textContent = `@${studentInfo.username}`;
        }

        const streak = updateStreak();
        if (streakCountEl) {
            streakCountEl.textContent = `${streak} Day${streak > 1 ? 's' : ''} Streak!`;
        }

        // Fetch & display latest faculty quizzes on student dashboard
        const dashboardQuizzesList = document.getElementById('dashboard-quizzes-list');
        async function loadDashboardQuizzes() {
            if (!dashboardQuizzesList) return;
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/api/quizzes`);
                const quizzes = await res.json();
                if (!quizzes || quizzes.length === 0) {
                    dashboardQuizzesList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No active quizzes yet. Your faculty will publish practice tests soon!</p>';
                    return;
                }

                dashboardQuizzesList.innerHTML = '';
                quizzes.slice(0, 4).forEach(q => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        background: var(--bg-glass);
                        border: 1px solid var(--border-subtle);
                        border-radius: var(--radius-md);
                        padding: 1rem 1.25rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    `;
                    const qCount = q.questions ? q.questions.length : 0;
                    item.innerHTML = `
                        <div>
                            <h4 style="font-size: 1rem; margin-bottom: 0.2rem;">${q.title}</h4>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">Class ${q.standard} • ${q.subject} • ${qCount} Questions</p>
                        </div>
                        <a href="quiz.html" class="btn btn-sm btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.9rem;">Start Test ▶</a>
                    `;
                    dashboardQuizzesList.appendChild(item);
                });
            } catch (e) {
                dashboardQuizzesList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Could not load quizzes at this time.</p>';
            }
        }
        loadDashboardQuizzes();

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('shikshamitr_student_token');
                localStorage.removeItem('shikshamitr_student_user');
                window.location.href = 'student-login.html';
            });
        }
    }

    // Student Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const fullName = document.getElementById('reg-fullname').value.trim();
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim() || null;
            const password = document.getElementById('reg-password').value;

            if (regSubmitBtn) {
                regSubmitBtn.textContent = 'Creating Account...';
                regSubmitBtn.disabled = true;
            }

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/auth/student-register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: fullName,
                        username: username,
                        email: email,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Account created successfully! Signing you in...', 'success');
                    // Automatically log in
                    setTimeout(async () => {
                        const loginParams = new URLSearchParams();
                        loginParams.append('username', username);
                        loginParams.append('password', password);

                        const loginRes = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: loginParams
                        });

                        if (loginRes.ok) {
                            const loginData = await loginRes.json();
                            localStorage.setItem('shikshamitr_student_token', loginData.access_token);
                            localStorage.setItem('shikshamitr_student_user', JSON.stringify({
                                username: username,
                                full_name: fullName
                            }));
                            window.location.href = 'student-dashboard.html';
                        } else {
                            tabLoginBtn.click();
                            showAlert('Registration complete! Please sign in.', 'success');
                        }
                    }, 1000);
                } else {
                    showAlert(data.detail || 'Registration failed', 'error');
                }
            } catch (err) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                if (regSubmitBtn) {
                    regSubmitBtn.textContent = 'Create Free Account ✨';
                    regSubmitBtn.disabled = false;
                }
            }
        });
    }

    // Student Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const identifier = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (loginSubmitBtn) {
                loginSubmitBtn.textContent = 'Signing in...';
                loginSubmitBtn.disabled = true;
            }

            const loginParams = new URLSearchParams();
            loginParams.append('username', identifier);
            loginParams.append('password', password);

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: loginParams
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('shikshamitr_student_token', data.access_token);
                    localStorage.setItem('shikshamitr_student_user', JSON.stringify({
                        username: identifier,
                        full_name: identifier
                    }));
                    window.location.href = 'student-dashboard.html';
                } else {
                    showAlert(data.detail || 'Incorrect username or password', 'error');
                }
            } catch (err) {
                showAlert('Network error. Please check your connection.', 'error');
            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.textContent = 'Sign In to Learning 🚀';
                    loginSubmitBtn.disabled = false;
                }
            }
        });
    }
});
