document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/reading`;

    const levelSelect = document.getElementById('level-select');
    const startBtn = document.getElementById('start-lesson-btn');
    const lessonArea = document.getElementById('lesson-area');
    
    const steps = ['word', 'pronunciation', 'reading', 'quiz'];
    let currentStepIndex = 0;
    
    const displayElement = document.getElementById('lesson-main-text') || document.getElementById('display-text');
    const meaningElement = document.getElementById('lesson-meaning');
    const quizArea = document.getElementById('quiz-area');
    const saveFlashcardBtn = document.getElementById('save-flashcard-btn');
    const listenBtn = document.getElementById('listen-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    
    let currentLessons = [];
    let currentLessonIndex = 0;

    // Dynamic, level-specific lessons with emojis to make it engaging
    const fallbackLessons = {
        "1": [
            { word: 'Cat', meaning: 'A small furry animal with whiskers.', sentence: 'The cat is sleeping. 🐱', quizQuestion: 'The ___ is sleeping.', quizOptions: ['Dog', 'Cat', 'Bird'], quizAnswer: 'Cat' },
            { word: 'Sun', meaning: 'The star around which the earth orbits.', sentence: 'The sun is bright today. ☀️', quizQuestion: 'The ___ is bright today.', quizOptions: ['Moon', 'Star', 'Sun'], quizAnswer: 'Sun' },
            { word: 'Apple', meaning: 'A round fruit with red or green skin.', sentence: 'I like to eat an apple. 🍎', quizQuestion: 'I like to eat an ___.', quizOptions: ['Apple', 'Banana', 'Orange'], quizAnswer: 'Apple' },
            { word: 'Book', meaning: 'A written or printed work consisting of pages.', sentence: 'She is reading a book. 📖', quizQuestion: 'She is reading a ___.', quizOptions: ['Paper', 'Book', 'Letter'], quizAnswer: 'Book' },
            { word: 'Happy', meaning: 'Feeling or showing pleasure or contentment.', sentence: 'He is very happy. 😊', quizQuestion: 'He is very ___.', quizOptions: ['Sad', 'Angry', 'Happy'], quizAnswer: 'Happy' }
        ],
        "2": [
            { word: 'Beautiful', meaning: 'Pleasing the senses or mind aesthetically.', sentence: 'The sunset is very beautiful today. 🌅', quizQuestion: 'The sunset is very ___ today.', quizOptions: ['Ugly', 'Beautiful', 'Boring'], quizAnswer: 'Beautiful' },
            { word: 'Journey', meaning: 'An act of traveling from one place to another.', sentence: 'Life is a journey, not a destination. 🛤️', quizQuestion: 'Life is a ___, not a destination.', quizOptions: ['Journey', 'Trip', 'Path'], quizAnswer: 'Journey' },
            { word: 'Friend', meaning: 'A person whom one knows and with mutual affection.', sentence: 'A true friend is hard to find. 🤝', quizQuestion: 'A true ___ is hard to find.', quizOptions: ['Enemy', 'Friend', 'Stranger'], quizAnswer: 'Friend' },
            { word: 'Imagine', meaning: 'Form a mental image or concept of.', sentence: 'Imagine a world full of peace. 🌍', quizQuestion: '___ a world full of peace.', quizOptions: ['See', 'Imagine', 'Know'], quizAnswer: 'Imagine' },
            { word: 'Curious', meaning: 'Eager to know or learn something.', sentence: 'The curious cat explored the garden. 🐈', quizQuestion: 'The ___ cat explored the garden.', quizOptions: ['Lazy', 'Curious', 'Angry'], quizAnswer: 'Curious' }
        ],
        "3": [
            { word: 'Fascinating', meaning: 'Extremely interesting.', sentence: 'The space documentary was truly fascinating. 🚀', quizQuestion: 'The space documentary was truly ___.', quizOptions: ['Boring', 'Fascinating', 'Long'], quizAnswer: 'Fascinating' },
            { word: 'Perseverance', meaning: 'Persistence in doing something despite difficulty.', sentence: 'Through perseverance, she achieved her goals. 💪', quizQuestion: 'Through ___, she achieved her goals.', quizOptions: ['Luck', 'Perseverance', 'Money'], quizAnswer: 'Perseverance' },
            { word: 'Metamorphosis', meaning: 'A change of the form or nature of a thing.', sentence: 'The caterpillar undergoes metamorphosis. 🦋', quizQuestion: 'The caterpillar undergoes ___.', quizOptions: ['Sleep', 'Metamorphosis', 'Eating'], quizAnswer: 'Metamorphosis' },
            { word: 'Knowledge', meaning: 'Facts, information, and skills acquired by a person.', sentence: 'Knowledge is power. 🧠', quizQuestion: '___ is power.', quizOptions: ['Money', 'Knowledge', 'Time'], quizAnswer: 'Knowledge' },
            { word: 'Enthusiastic', meaning: 'Having or showing intense and eager enjoyment.', sentence: 'The students were enthusiastic about the project. 🎉', quizQuestion: 'The students were ___ about the project.', quizOptions: ['Bored', 'Enthusiastic', 'Upset'], quizAnswer: 'Enthusiastic' }
        ]
    };

    const updateStepUI = () => {
        steps.forEach((step, index) => {
            const stepEl = document.getElementById(`step-${step}`);
            if (index < currentStepIndex) {
                stepEl.className = 'step completed';
            } else if (index === currentStepIndex) {
                stepEl.className = 'step active';
            } else {
                stepEl.className = 'step';
            }
        });
    };

    const displayCurrentContent = () => {
        updateStepUI();
        const lesson = currentLessons[currentLessonIndex];
        
        if (!lesson) {
            lessonArea.innerHTML = `
                <div class="lesson-complete animate-pulse" style="text-align: center;">
                    <span class="complete-icon" style="font-size: 3rem;">🏆</span>
                    <h2>Great Job!</h2>
                    <p>You finished all the reading exercises for this level.</p>
                    <p id="points-reward-msg" style="color: var(--success); font-weight: bold; margin-top: 1rem;"></p>
                    <button class="btn btn-accent" style="margin-top: 1rem;" onclick="location.reload()">Start Another Lesson</button>
                </div>
            `;
            
            // Call API to complete lesson and award points
            const actualToken = localStorage.getItem('token') || localStorage.getItem('shikshamitr_student_token');
            fetch(`${API_URL}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${actualToken}`
                }
            }).then(res => res.json()).then(data => {
                if (data.points_awarded > 0) {
                    document.getElementById('points-reward-msg').textContent = `+${data.points_awarded} Community Points Earned!`;
                }
            }).catch(err => console.error("Could not award points:", err));
            
            return;
        }

        listenBtn.style.display = 'inline-block';
        saveFlashcardBtn.style.display = 'inline-block';
        if (quizArea) quizArea.style.display = 'none';
        if (meaningElement) meaningElement.style.display = 'none';
        nextStepBtn.disabled = false;
        
        const currentStep = steps[currentStepIndex];
        
        switch (currentStep) {
            case 'word':
                displayElement.textContent = lesson.word;
                if (meaningElement && lesson.meaning) {
                    meaningElement.textContent = lesson.meaning;
                    meaningElement.style.display = 'block';
                }
                break;
            case 'pronunciation':
                displayElement.textContent = `🔊 ${lesson.word}`;
                // Auto play pronunciation
                speak(lesson.word);
                break;
            case 'reading':
                displayElement.textContent = lesson.sentence;
                break;
            case 'quiz':
                displayElement.textContent = lesson.quizQuestion || lesson.sentence;
                listenBtn.style.display = 'none';
                saveFlashcardBtn.style.display = 'none';
                
                if (quizArea && lesson.quizOptions) {
                    quizArea.style.display = 'flex';
                    quizArea.style.gap = '0.5rem';
                    quizArea.style.flexWrap = 'wrap';
                    quizArea.style.justifyContent = 'center';
                    quizArea.innerHTML = '';
                    
                    nextStepBtn.disabled = true; // wait for answer
                    
                    lesson.quizOptions.forEach(opt => {
                        const btn = document.createElement('button');
                        btn.className = 'btn btn-outline';
                        btn.textContent = opt;
                        btn.onclick = () => {
                            if (opt === lesson.quizAnswer) {
                                btn.classList.add('btn-primary');
                                btn.classList.remove('btn-outline');
                                displayElement.textContent = "Correct! 🎉";
                                nextStepBtn.disabled = false;
                            } else {
                                btn.style.backgroundColor = 'var(--danger)';
                                btn.style.color = 'white';
                                btn.style.borderColor = 'var(--danger)';
                                setTimeout(() => {
                                    btn.style.backgroundColor = '';
                                    btn.style.color = '';
                                    btn.style.borderColor = '';
                                }, 800);
                            }
                        };
                        quizArea.appendChild(btn);
                    });
                } else {
                    // Fallback if no quiz data
                    speak(lesson.sentence);
                }
                break;
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Remove emojis from speech using modern Unicode property escapes to preserve Indian/non-Latin scripts
            const cleanText = text.replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'en-US'; // Can be changed based on preference
            utterance.rate = 0.85; // Slightly slower for learning
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, your browser doesn't support text to speech!");
        }
    };

    startBtn.addEventListener('click', async () => {
        const level = levelSelect.value;
        startBtn.textContent = 'Loading...';
        startBtn.disabled = true;

        let timeoutId;
        
        try {
            timeoutId = setTimeout(() => {
                const messageEl = document.createElement('div');
                messageEl.id = 'cold-start-msg';
                messageEl.style.cssText = 'text-align: center; color: var(--primary); font-size: 0.9rem; padding: 1rem; background: var(--primary-glow); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1rem; animation: fadeIn 0.3s ease-out;';
                messageEl.innerHTML = '☁️ Waking up the server, please wait a few seconds...';
                lessonArea.prepend(messageEl);
            }, 2500);

            const response = await fetch(`${API_URL}?level=${level}`);
            clearTimeout(timeoutId);
            
            const msg = document.getElementById('cold-start-msg');
            if (msg) msg.remove();

            if (response.ok) {
                currentLessons = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch lessons, using fallbacks', error);
            const msg = document.getElementById('cold-start-msg');
            if (msg) msg.remove();
        }
        
        // If DB is empty, use fallbacks for demonstration
        if (currentLessons.length === 0) {
            currentLessons = [...(fallbackLessons[level] || fallbackLessons["1"])];
            // Shuffle lessons to make them dynamic and engaging each time
            currentLessons.sort(() => 0.5 - Math.random());
        }

        lessonArea.classList.remove('hidden');
        currentStepIndex = 0;
        currentLessonIndex = 0;
        startBtn.textContent = 'Start Lesson';
        startBtn.disabled = false;
        
        nextStepBtn.style.display = 'inline-block';
        displayCurrentContent();
    });

    saveFlashcardBtn.addEventListener('click', async () => {
        const lesson = currentLessons[currentLessonIndex];
        if (!lesson) return;
        
        saveFlashcardBtn.textContent = 'Saving...';
        saveFlashcardBtn.disabled = true;
        
        try {
            const actualToken = localStorage.getItem('token') || localStorage.getItem('shikshamitr_student_token');
            if (!actualToken) {
                alert('Please log in to save flashcards.');
                saveFlashcardBtn.textContent = '🧠 Save to Flashcards';
                saveFlashcardBtn.disabled = false;
                return;
            }
            
            const response = await fetch(`${BACKEND_BASE_URL}/api/flashcards/my-vocabulary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${actualToken}`
                },
                body: JSON.stringify({
                    front: lesson.word,
                    back: `${lesson.meaning || ''} \n\n ${lesson.sentence}`
                })
            });
            
            if (response.ok) {
                saveFlashcardBtn.textContent = '✅ Saved!';
            } else {
                saveFlashcardBtn.textContent = '❌ Error';
            }
        } catch (e) {
            saveFlashcardBtn.textContent = '❌ Error';
        }
        
        setTimeout(() => {
            if (saveFlashcardBtn.textContent !== '✅ Saved!') {
                saveFlashcardBtn.textContent = '🧠 Save to Flashcards';
                saveFlashcardBtn.disabled = false;
            }
        }, 2000);
    });

    listenBtn.addEventListener('click', () => {
        const lesson = currentLessons[currentLessonIndex];
        if (!lesson) return;
        
        const currentStep = steps[currentStepIndex];
        if (currentStep === 'word' || currentStep === 'pronunciation') {
            speak(lesson.word);
        } else {
            speak(lesson.sentence);
        }
    });

    nextStepBtn.addEventListener('click', () => {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
        } else {
            // Move to next lesson
            currentStepIndex = 0;
            currentLessonIndex++;
        }
        displayCurrentContent();
    });
});
