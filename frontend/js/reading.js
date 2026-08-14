document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const RENDER_BACKEND_URL = 'https://shikshamitr.onrender.com';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : RENDER_BACKEND_URL;
    const API_URL = `${BACKEND_BASE_URL}/api/reading`;

    const levelSelect = document.getElementById('level-select');
    const startBtn = document.getElementById('start-lesson-btn');
    const lessonArea = document.getElementById('lesson-area');
    
    const steps = ['word', 'pronunciation', 'reading', 'sentence'];
    let currentStepIndex = 0;
    
    const displayElement = document.getElementById('display-text');
    const listenBtn = document.getElementById('listen-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    
    let currentLessons = [];
    let currentLessonIndex = 0;

    // Dynamic, level-specific lessons with emojis to make it engaging
    const fallbackLessons = {
        "1": [
            { word: 'Cat', sentence: 'The cat is sleeping. 🐱' },
            { word: 'Sun', sentence: 'The sun is bright today. ☀️' },
            { word: 'Apple', sentence: 'I like to eat an apple. 🍎' },
            { word: 'Book', sentence: 'She is reading a book. 📖' },
            { word: 'Happy', sentence: 'He is very happy. 😊' }
        ],
        "2": [
            { word: 'Beautiful', sentence: 'The sunset is very beautiful today. 🌅' },
            { word: 'Journey', sentence: 'Life is a journey, not a destination. 🛤️' },
            { word: 'Friend', sentence: 'A true friend is hard to find. 🤝' },
            { word: 'Imagine', sentence: 'Imagine a world full of peace. 🌍' },
            { word: 'Curious', sentence: 'The curious cat explored the garden. 🐈' }
        ],
        "3": [
            { word: 'Fascinating', sentence: 'The space documentary was truly fascinating. 🚀' },
            { word: 'Perseverance', sentence: 'Through perseverance, she achieved her goals. 💪' },
            { word: 'Metamorphosis', sentence: 'The caterpillar undergoes metamorphosis. 🦋' },
            { word: 'Knowledge', sentence: 'Knowledge is power. 🧠' },
            { word: 'Enthusiastic', sentence: 'The students were enthusiastic about the project. 🎉' }
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
                <div class="lesson-complete animate-pulse">
                    <span class="complete-icon">🏆</span>
                    <h2>Great Job!</h2>
                    <p>You finished all the reading exercises for this level.</p>
                    <button class="btn btn-accent" style="margin-top: 1rem;" onclick="location.reload()">Start Another Lesson</button>
                </div>
            `;
            return;
        }

        listenBtn.style.display = 'inline-block';
        
        const currentStep = steps[currentStepIndex];
        
        switch (currentStep) {
            case 'word':
                displayElement.textContent = lesson.word;
                break;
            case 'pronunciation':
                displayElement.textContent = `🔊 ${lesson.word}`;
                // Auto play pronunciation
                speak(lesson.word);
                break;
            case 'reading':
                displayElement.textContent = lesson.sentence;
                break;
            case 'sentence':
                displayElement.textContent = lesson.sentence;
                // Auto play sentence
                speak(lesson.sentence);
                break;
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Remove emojis from speech
            const cleanText = text.replace(/[\u1000-\uFFFF]+/g, '');
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

        try {
            const response = await fetch(`${API_URL}?level=${level}`);
            if (response.ok) {
                currentLessons = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch lessons, using fallbacks', error);
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
