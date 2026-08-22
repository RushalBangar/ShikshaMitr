document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;

    // Views
    const quizListView = document.getElementById('quiz-list-view');
    const quizPlayerView = document.getElementById('quiz-player-view');
    const quizResultsView = document.getElementById('quiz-results-view');

    // List elements
    const quizListContainer = document.getElementById('quiz-list-container');
    const standardFilter = document.getElementById('standard-filter');

    // Player elements
    const activeQuizTitle = document.getElementById('active-quiz-title');
    const activeQuizSubtitle = document.getElementById('active-quiz-subtitle');
    const questionNumberLabel = document.getElementById('question-number-label');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationBox = document.getElementById('explanation-box');
    const explanationText = document.getElementById('explanation-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const backToListBtn = document.getElementById('back-to-list-btn');

    // Results elements
    const resultPercentage = document.getElementById('result-percentage');
    const resultFraction = document.getElementById('result-fraction');
    const resultVerdict = document.getElementById('result-verdict');
    const retryQuizBtn = document.getElementById('retry-quiz-btn');
    const resultsBackBtn = document.getElementById('results-back-btn');

    let currentQuiz = null;
    let currentQuestionIdx = 0;
    let userAnswers = [];

    // 1. Fetch & Load Quizzes
    async function loadQuizzes() {
        quizListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading available quizzes...</p>';
        const standard = standardFilter ? standardFilter.value : '';
        const url = standard ? `${BACKEND_BASE_URL}/api/quizzes?standard=${standard}` : `${BACKEND_BASE_URL}/api/quizzes`;

        try {
            const response = await fetch(url);
            const quizzes = await response.json();

            if (!quizzes || quizzes.length === 0) {
                quizListContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-card);">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📝</span>
                        <h3>No Quizzes Found</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Check back soon or ask your faculty to upload one!</p>
                    </div>
                `;
                return;
            }

            quizListContainer.innerHTML = '';
            quizzes.forEach(quiz => {
                const card = document.createElement('div');
                card.className = 'quiz-card-item';
                const count = quiz.questions ? quiz.questions.length : 0;

                card.innerHTML = `
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="font-size: 1.15rem; margin-bottom: 0.3rem;">${quiz.title}</h3>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span class="badge badge-standard">Class ${quiz.standard}</span>
                            <span class="badge badge-subject">${quiz.subject}</span>
                            <span class="badge" style="background: var(--bg-surface); color: var(--text-secondary);">${count} Questions</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-primary" style="white-space: nowrap;">Start Quiz ▶</button>
                `;

                const startBtn = card.querySelector('button');
                startBtn.onclick = () => startQuiz(quiz);

                quizListContainer.appendChild(card);
            });
        } catch (err) {
            quizListContainer.innerHTML = '<p style="text-align: center; color: var(--status-error-text);">Failed to load quizzes. Please check your connection.</p>';
        }
    }

    if (standardFilter) {
        standardFilter.addEventListener('change', loadQuizzes);
    }

    // 2. Start Quiz Player
    function startQuiz(quiz) {
        currentQuiz = quiz;
        currentQuestionIdx = 0;
        userAnswers = new Array(quiz.questions.length).fill(null);

        quizListView.style.display = 'none';
        quizResultsView.style.display = 'none';
        quizPlayerView.style.display = 'block';

        activeQuizTitle.textContent = quiz.title;
        activeQuizSubtitle.textContent = `Class ${quiz.standard} • ${quiz.subject}`;

        renderQuestion();
    }

    // 3. Render Current Question
    function renderQuestion() {
        if (!currentQuiz || !currentQuiz.questions[currentQuestionIdx]) return;

        const q = currentQuiz.questions[currentQuestionIdx];
        const total = currentQuiz.questions.length;

        // Progress bar
        const percent = ((currentQuestionIdx + 1) / total) * 100;
        quizProgressFill.style.width = `${percent}%`;
        questionNumberLabel.textContent = `Question ${currentQuestionIdx + 1} of ${total}`;

        questionText.textContent = q.question;
        explanationBox.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        submitQuizBtn.style.display = 'none';

        optionsContainer.innerHTML = '';
        const optionLabels = ['A', 'B', 'C', 'D'];

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `
                <span class="option-indicator">${optionLabels[idx] || idx + 1}</span>
                <span style="flex: 1;">${opt}</span>
            `;

            btn.onclick = () => selectOption(idx);
            optionsContainer.appendChild(btn);
        });
    }

    // 4. Handle Option Selection & Instant Feedback
    function selectOption(selectedIdx) {
        const q = currentQuiz.questions[currentQuestionIdx];
        userAnswers[currentQuestionIdx] = selectedIdx;

        const allOptionBtns = optionsContainer.querySelectorAll('.option-btn');
        allOptionBtns.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === q.correct_option) {
                btn.classList.add('correct');
            } else if (idx === selectedIdx) {
                btn.classList.add('incorrect');
            }
        });

        // Show Explanation
        if (q.explanation) {
            explanationText.textContent = q.explanation;
            explanationBox.style.display = 'block';
        }

        // Show Next or Submit button
        const isLastQuestion = currentQuestionIdx === currentQuiz.questions.length - 1;
        if (isLastQuestion) {
            submitQuizBtn.style.display = 'inline-flex';
        } else {
            nextQuestionBtn.style.display = 'inline-flex';
        }
    }

    // Next Question
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            currentQuestionIdx++;
            renderQuestion();
        });
    }

    // Submit Quiz & Show Scorecard
    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please log in to submit the quiz and track your progress.");
                return;
            }
            
            try {
                submitQuizBtn.disabled = true;
                submitQuizBtn.textContent = 'Submitting...';
                
                const response = await fetch(`${BACKEND_BASE_URL}/api/quizzes/${currentQuiz.id || currentQuiz._id}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quiz_id: currentQuiz.id || currentQuiz._id,
                        answers: userAnswers
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to submit quiz');
                }
                
                const result = await response.json();
                
                quizPlayerView.style.display = 'none';
                quizResultsView.style.display = 'block';

                resultPercentage.textContent = `${result.score_percentage}%`;
                resultFraction.textContent = `${result.correct_answers}/${result.total_questions} Correct`;

                if (result.score_percentage >= 80) {
                    resultVerdict.textContent = '🌟 Outstanding Mastery! Keep it up!';
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#6366F1', '#F59E0B', '#10B981']
                        });
                    }
                } else if (result.score_percentage >= 50) {
                    resultVerdict.textContent = '👍 Good Effort! Revise and try again!';
                } else {
                    resultVerdict.textContent = '📚 Needs Practice! Review the notes and try again.';
                }
            } catch (err) {
                alert("An error occurred while submitting. Your score won't be saved.");
                console.error(err);
            } finally {
                submitQuizBtn.disabled = false;
                submitQuizBtn.textContent = 'Submit Quiz ▶';
            }
        });
    }

    // Navigation buttons
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            quizPlayerView.style.display = 'none';
            quizResultsView.style.display = 'none';
            quizListView.style.display = 'block';
            loadQuizzes();
        });
    }

    if (resultsBackBtn) {
        resultsBackBtn.addEventListener('click', () => {
            quizResultsView.style.display = 'none';
            quizListView.style.display = 'block';
            loadQuizzes();
        });
    }

    if (retryQuizBtn) {
        retryQuizBtn.addEventListener('click', () => {
            if (currentQuiz) startQuiz(currentQuiz);
        });
    }

    // Initial load
    loadQuizzes();
});
