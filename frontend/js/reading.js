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

    // We can fall back to hardcoded lessons if the backend has none yet for testing
    const fallbackLessons = [
        { word: 'Apple', sentence: 'An apple a day keeps the doctor away.' },
        { word: 'Beautiful', sentence: 'The sunset is very beautiful today.' },
        { word: 'Knowledge', sentence: 'Knowledge is power.' }
    ];

    const updateStepUI = () => {
        steps.forEach((step, index) => {
            const stepEl = document.getElementById(`step-${step}`);
            if (index === currentStepIndex) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    };

    const displayCurrentContent = () => {
        updateStepUI();
        const lesson = currentLessons[currentLessonIndex] || fallbackLessons[currentLessonIndex];
        
        if (!lesson) {
            displayElement.textContent = "Great job! You finished the lesson.";
            listenBtn.style.display = 'none';
            nextStepBtn.style.display = 'none';
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
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; // Can be changed based on preference
            utterance.rate = 0.9; // Slightly slower for learning
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
            currentLessons = fallbackLessons;
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
        const lesson = currentLessons[currentLessonIndex] || fallbackLessons[currentLessonIndex];
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
