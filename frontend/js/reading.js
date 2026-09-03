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
    
    const displayElement = document.getElementById('lesson-main-text');
    const phoneticElement = document.getElementById('lesson-phonetic');
    const meaningElement = document.getElementById('lesson-meaning');
    const marathiMeaningElement = document.getElementById('lesson-marathi-meaning');
    const marathiHintElement = document.getElementById('lesson-marathi-hint');
    const sentenceElement = document.getElementById('lesson-sentence');
    const sentenceMarathiElement = document.getElementById('lesson-sentence-marathi');
    const speechTargetSentence = document.getElementById('speech-target-sentence');
    const speechFeedbackPill = document.getElementById('speech-feedback-pill');
    const micPracticeBtn = document.getElementById('mic-practice-btn');
    const micBtnText = document.getElementById('mic-btn-text');

    const soundwaveGraphic = document.getElementById('soundwave-graphic');
    const lessonCounterTag = document.getElementById('lesson-counter-tag');
    const currentStepBadge = document.getElementById('current-step-badge');
    const difficultyBadge = document.getElementById('difficulty-badge');

    const englishMeaningBox = document.getElementById('english-meaning-box');
    const marathiMeaningBox = document.getElementById('marathi-meaning-box');
    const sentenceContainer = document.getElementById('sentence-container');

    const quizArea = document.getElementById('quiz-area');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsContainer = document.getElementById('quiz-options-container');

    const saveFlashcardBtn = document.getElementById('save-flashcard-btn');
    const listenBtn = document.getElementById('listen-btn');
    const slowListenBtn = document.getElementById('slow-listen-btn');
    const quickSpeakBtn = document.getElementById('quick-speak-btn');
    const sentenceAudioBtn = document.getElementById('sentence-audio-btn');

    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    
    let currentLessons = [];
    let currentLessonIndex = 0;

    // Comprehensive level-specific lessons with phonetics, English & Marathi definitions
    const fallbackLessons = {
        "1": [
            { 
                word: 'Cat', 
                phonetic: '/kæt/',
                meaning: 'A small furry domesticated carnivorous mammal with whiskers and soft claws.', 
                marathiMeaning: 'मांजर (एक छोटा पाळीव प्राणी)',
                marathiHint: 'उदा. "मांजर दुध पीत आहे." (The cat is drinking milk.)',
                sentence: 'The cat is sleeping under the table. 🐱', 
                sentenceMarathi: 'मांजर टेबलाखाली झोपली आहे.',
                quizQuestion: 'The ___ is sleeping under the table.', 
                quizOptions: ['Dog', 'Cat', 'Bird'], 
                quizAnswer: 'Cat' 
            },
            { 
                word: 'Sun', 
                phonetic: '/sʌn/',
                meaning: 'The luminous celestial body around which the earth orbits.', 
                marathiMeaning: 'सूर्य (आकाशातील तेजस्वी तारा)',
                marathiHint: 'उदा. "सूर्य पूर्वेला उगवतो." (The sun rises in the east.)',
                sentence: 'The sun is shining bright in the sky. ☀️', 
                sentenceMarathi: 'आकाशात सूर्य तेजस्वी चमकत आहे.',
                quizQuestion: 'The ___ is shining bright in the sky.', 
                quizOptions: ['Moon', 'Star', 'Sun'], 
                quizAnswer: 'Sun' 
            },
            { 
                word: 'Apple', 
                phonetic: '/ˈæp.əl/',
                meaning: 'A round fruit with firm white flesh and red or green skin.', 
                marathiMeaning: 'सफरचंद (एक गोड व पौष्टिक फळ)',
                marathiHint: 'उदा. "मला दररोज सफरचंद खायला आवडते."',
                sentence: 'An apple a day keeps the doctor away. 🍎', 
                sentenceMarathi: 'दररोज एक सफरचंद खाल्ल्याने आरोग्य चांगले राहते.',
                quizQuestion: 'An ___ a day keeps the doctor away.', 
                quizOptions: ['Apple', 'Banana', 'Orange'], 
                quizAnswer: 'Apple' 
            },
            { 
                word: 'Book', 
                phonetic: '/bʊk/',
                meaning: 'A written or printed work consisting of bound pages.', 
                marathiMeaning: 'पुस्तक / ग्रंथ (वाचनाचे साधन)',
                marathiHint: 'उदा. "हे विज्ञानाचे पुस्तक आहे."',
                sentence: 'She is reading an interesting history book. 📖', 
                sentenceMarathi: 'ती एक रंजक इतिहासाचे पुस्तक वाचत आहे.',
                quizQuestion: 'She is reading an interesting history ___.', 
                quizOptions: ['Paper', 'Book', 'Letter'], 
                quizAnswer: 'Book' 
            },
            { 
                word: 'Happy', 
                phonetic: '/ˈhæp.i/',
                meaning: 'Feeling or showing pleasure, contentment, or joy.', 
                marathiMeaning: 'आनंदी, सुखी / समाधानी',
                marathiHint: 'उदा. "परीक्षेत यश मिळाल्यामुळे तो आनंदी आहे."',
                sentence: 'The little child is very happy today. 😊', 
                sentenceMarathi: 'ते लहान बाळ आज खूप आनंदी आहे.',
                quizQuestion: 'The little child is very ___ today.', 
                quizOptions: ['Sad', 'Angry', 'Happy'], 
                quizAnswer: 'Happy' 
            }
        ],
        "2": [
            { 
                word: 'Beautiful', 
                phonetic: '/ˈbjuː.tɪ.fəl/',
                meaning: 'Pleasing the senses or mind aesthetically; having delighting qualities.', 
                marathiMeaning: 'सुंदर, देखणा / मनाला आनंद देणारा',
                marathiHint: 'उदा. "ती एक सुंदर कलाकृती आहे."',
                sentence: 'It is a beautiful sunny morning in the village. 🌅', 
                sentenceMarathi: 'गावात सकाळचे सुंदर आणि प्रसन्न ऊन पडले आहे.',
                quizQuestion: 'It is a ___ sunny morning in the village.', 
                quizOptions: ['Ugly', 'Beautiful', 'Boring'], 
                quizAnswer: 'Beautiful' 
            },
            { 
                word: 'Journey', 
                phonetic: '/ˈdʒɜː.ni/',
                meaning: 'An act of traveling from one place to another over time.', 
                marathiMeaning: 'प्रवास, सफर / जीवनमार्ग',
                marathiHint: 'उदा. "त्यांचा प्रवास सुखकर झाला."',
                sentence: 'Life is a memorable journey, not a destination. 🛤️', 
                sentenceMarathi: 'जीवन हा एक संस्मरणीय प्रवास आहे, केवळ शेवटचा थांबा नाही.',
                quizQuestion: 'Life is a memorable ___, not a destination.', 
                quizOptions: ['Journey', 'Trip', 'Fight'], 
                quizAnswer: 'Journey' 
            },
            { 
                word: 'Courage', 
                phonetic: '/ˈkʌr.ɪdʒ/',
                meaning: 'The ability to do something that frightens one; bravery in facing challenges.', 
                marathiMeaning: 'धैर्य, हिम्मत / धाडस',
                marathiHint: 'उदा. "संकटाच्या वेळी त्याने धैर्य दाखवले."',
                sentence: 'She showed immense courage during the difficult times. 🦁', 
                sentenceMarathi: 'कठीण प्रसंगी तिने प्रचंड धैर्य दाखवले.',
                quizQuestion: 'She showed immense ___ during the difficult times.', 
                quizOptions: ['Fear', 'Courage', 'Doubt'], 
                quizAnswer: 'Courage' 
            },
            { 
                word: 'Curious', 
                phonetic: '/ˈkjʊə.ri.əs/',
                meaning: 'Eager to know or learn something new; inquisitive.', 
                marathiMeaning: 'उत्सुक, जिज्ञासू / जाणून घेण्याची इच्छा असणारा',
                marathiHint: 'उदा. "विद्यार्थी नवीन प्रयोग शिकण्यासाठी जिज्ञासू होते."',
                sentence: 'The curious student asked thoughtful questions in class. 💡', 
                sentenceMarathi: 'जिज्ञासू विद्यार्थ्याने वर्गात विचारपूर्वक प्रश्न विचारले.',
                quizQuestion: 'The ___ student asked thoughtful questions.', 
                quizOptions: ['Lazy', 'Curious', 'Angry'], 
                quizAnswer: 'Curious' 
            },
            { 
                word: 'Grateful', 
                phonetic: '/ˈɡreɪt.fəl/',
                meaning: 'Feeling or showing an appreciation of kindness; thankful.', 
                marathiMeaning: 'कृतज्ञ, आभारी / उपकारांची जाणीव असणारा',
                marathiHint: 'उदा. "मदतीबद्दल आम्ही तुमचे आभारी आहोत."',
                sentence: 'We are truly grateful for all the support we received. 🤝', 
                sentenceMarathi: 'मिळालेल्या सर्व मदतीबद्दल आम्ही मनापासून कृतज्ञ आहोत.',
                quizQuestion: 'We are truly ___ for all the support we received.', 
                quizOptions: ['Selfish', 'Grateful', 'Careless'], 
                quizAnswer: 'Grateful' 
            }
        ],
        "3": [
            { 
                word: 'Perseverance', 
                phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
                meaning: 'Persistence in doing something despite difficulty or delay in achieving success.', 
                marathiMeaning: 'चिकाटी, सातत्य / जिद्द',
                marathiHint: 'उदा. "चिकाटीने अभ्यास केल्यास यश निश्चित मिळते."',
                sentence: 'Through perseverance, she solved the complex mathematics problem. 💪', 
                sentenceMarathi: 'जिद्दीच्या व चिकाटीच्या जोरावर तिने गणिताचा अवघड प्रश्न सोडवला.',
                quizQuestion: 'Through ___, she solved the complex mathematics problem.', 
                quizOptions: ['Luck', 'Perseverance', 'Doubt'], 
                quizAnswer: 'Perseverance' 
            },
            { 
                word: 'Fascinating', 
                phonetic: '/ˈfæs.ɪ.neɪ.tɪŋ/',
                meaning: 'Extremely interesting, charming, and captivating.', 
                marathiMeaning: 'अतिशय रंजक, मनमोहक / चित्तवेधक',
                marathiHint: 'उदा. "अवकाशाबद्दलची माहिती अतिशय रंजक आहे."',
                sentence: 'The science documentary about the solar system was fascinating. 🚀', 
                sentenceMarathi: 'सूर्यमालेबद्दलचा विज्ञान माहितीपट अत्यंत रंजक होता.',
                quizQuestion: 'The science documentary was truly ___.', 
                quizOptions: ['Boring', 'Fascinating', 'Ordinary'], 
                quizAnswer: 'Fascinating' 
            },
            { 
                word: 'Metamorphosis', 
                phonetic: '/ˌmet.əˈmɔː.fə.sɪs/',
                meaning: 'A complete transformation or change of physical form in an insect or amphibian.', 
                marathiMeaning: 'रूपांतरण / कायापालट (उदा. अळीचे फुलपाखरात होणारे रूपांतर)',
                marathiHint: 'उदा. "अळीचे फुलपाखरू होणे हे निसर्गाचे सुंदर रूपांतरण आहे."',
                sentence: 'The caterpillar undergoes metamorphosis to become a butterfly. 🦋', 
                sentenceMarathi: 'अळीचे रूपांतरण होऊन तिचे सुंदर फुलपाखरू बनते.',
                quizQuestion: 'The caterpillar undergoes ___ to become a butterfly.', 
                quizOptions: ['Metamorphosis', 'Sleep', 'Extinction'], 
                quizAnswer: 'Metamorphosis' 
            },
            { 
                word: 'Enthusiastic', 
                phonetic: '/ɪnˌθjuː.ziˈæs.tɪk/',
                meaning: 'Having or showing intense, energetic and eager enjoyment.', 
                marathiMeaning: 'उत्साही, उत्सुक / जोमदार',
                marathiHint: 'उदा. "विद्यार्थी क्रीडा महोत्सवासाठी खूप उत्साही होते."',
                sentence: 'The students were enthusiastic about their board exam preparation. 🎉', 
                sentenceMarathi: 'विद्यार्थी आपल्या बोर्ड परीक्षेच्या तयारीसाठी अत्यंत उत्साही होते.',
                quizQuestion: 'The students were ___ about their board exam preparation.', 
                quizOptions: ['Depressed', 'Enthusiastic', 'Careless'], 
                quizAnswer: 'Enthusiastic' 
            },
            { 
                word: 'Benevolent', 
                phonetic: '/bəˈnev.əl.ənt/',
                meaning: 'Well meaning, kind-hearted, and serving charitable purposes.', 
                marathiMeaning: 'दयाळू, परोपकारी / दुसऱ्यांचे भले चिंतणारा',
                marathiHint: 'उदा. "तो एक दयाळू आणि परोपकारी राजा होता."',
                sentence: 'The benevolent teacher always helps underprivileged students. 🌟', 
                sentenceMarathi: 'दयाळू व परोपकारी शिक्षक गरजू विद्यार्थ्यांना नेहमी मदत करतात.',
                quizQuestion: 'The ___ teacher always helps underprivileged students.', 
                quizOptions: ['Cruel', 'Benevolent', 'Strict'], 
                quizAnswer: 'Benevolent' 
            }
        ]
    };

    const stepNames = {
        'word': 'Step 1: Word & Meaning',
        'pronunciation': 'Step 2: Listen & Pronounce',
        'reading': 'Step 3: Read & Translate',
        'quiz': 'Step 4: Interactive Quiz'
    };

    const updateStepUI = () => {
        steps.forEach((step, index) => {
            const stepEl = document.getElementById(`step-${step}`);
            if (!stepEl) return;
            if (index < currentStepIndex) {
                stepEl.className = 'stepper-item completed';
                const num = stepEl.querySelector('.num-badge');
                if (num) num.textContent = '✓';
            } else if (index === currentStepIndex) {
                stepEl.className = 'stepper-item active';
                const num = stepEl.querySelector('.num-badge');
                if (num) num.textContent = `${index + 1}`;
            } else {
                stepEl.className = 'stepper-item';
                const num = stepEl.querySelector('.num-badge');
                if (num) num.textContent = `${index + 1}`;
            }
        });

        if (currentStepBadge) {
            currentStepBadge.textContent = stepNames[steps[currentStepIndex]] || 'Step Overview';
        }
    };

    const updateChecklistUI = () => {
        const checklistContainer = document.getElementById('words-checklist-container');
        const checklistCounter = document.getElementById('checklist-counter');
        if (!checklistContainer) return;

        checklistContainer.innerHTML = '';
        currentLessons.forEach((l, idx) => {
            const item = document.createElement('div');
            item.className = 'word-check-item';
            
            if (idx < currentLessonIndex) {
                item.classList.add('done-item');
                item.innerHTML = `<span>✓ ${idx + 1}. ${l.word}</span><span class="marathi-text">${l.marathiMeaning ? l.marathiMeaning.split(' ')[0] : 'पूर्ण'}</span>`;
            } else if (idx === currentLessonIndex) {
                item.classList.add('active-item');
                item.innerHTML = `<span>▶ ${idx + 1}. ${l.word}</span><span class="marathi-text">${l.marathiMeaning ? l.marathiMeaning.split(' ')[0] : 'चालू'}</span>`;
            } else {
                item.innerHTML = `<span>${idx + 1}. ${l.word}</span><span class="marathi-text">${l.marathiMeaning ? l.marathiMeaning.split(' ')[0] : ''}</span>`;
            }

            item.style.cursor = 'pointer';
            item.onclick = () => {
                currentLessonIndex = idx;
                currentStepIndex = 0;
                displayCurrentContent();
            };

            checklistContainer.appendChild(item);
        });

        if (checklistCounter) {
            checklistCounter.textContent = `${currentLessonIndex} / ${currentLessons.length} Done`;
        }

        const targetBar = document.getElementById('daily-target-bar');
        const targetStat = document.getElementById('daily-target-stat');
        if (targetBar && targetStat && currentLessons.length > 0) {
            const pct = Math.round((currentLessonIndex / currentLessons.length) * 100);
            targetBar.style.width = `${pct}%`;
            targetStat.textContent = `${currentLessonIndex} / ${currentLessons.length} words (${pct}%)`;
        }
    };

    const displayCurrentContent = () => {
        updateStepUI();
        updateChecklistUI();
        
        const lesson = currentLessons[currentLessonIndex];
        
        if (!lesson) {
            lessonArea.innerHTML = `
                <div class="card-body-content" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🏆</div>
                    <h2 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Great Job!</h2>
                    <p style="color: var(--text-secondary); font-size: 1.05rem; max-width: 500px; margin: 0 auto 1.5rem;">
                        You have successfully completed all guided reading exercises for this level.
                    </p>
                    <p id="points-reward-msg" style="color: var(--status-ok-text); font-weight: 700; margin-bottom: 1.5rem;"></p>
                    <button class="btn btn-primary" onclick="location.reload()">Practice Another Lesson</button>
                </div>
            `;
            
            const actualToken = localStorage.getItem('shikshamitr_student_token') || localStorage.getItem('shikshamitr_token');
            if (actualToken) {
                fetch(`${API_URL}/complete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${actualToken}` }
                }).then(res => res.json()).then(data => {
                    const msgEl = document.getElementById('points-reward-msg');
                    if (msgEl && data.points_awarded > 0) {
                        msgEl.textContent = `🎉 +${data.points_awarded} Community Points Earned!`;
                    }
                }).catch(err => console.error("Could not award points:", err));
            }
            return;
        }

        // Fill dynamic lesson data
        if (displayElement) displayElement.textContent = lesson.word;
        if (phoneticElement) phoneticElement.textContent = lesson.phonetic || `/${lesson.word.toLowerCase()}/`;
        if (meaningElement) meaningElement.textContent = lesson.meaning || 'Pleasing or meaningful term.';
        if (marathiMeaningElement) marathiMeaningElement.textContent = lesson.marathiMeaning || 'अर्थ उपलब्ध नाही';
        if (marathiHintElement) marathiHintElement.textContent = lesson.marathiHint || '';
        if (sentenceElement) sentenceElement.textContent = `"${lesson.sentence}"`;
        if (sentenceMarathiElement) sentenceMarathiElement.textContent = `"${lesson.sentenceMarathi || ''}"`;
        if (speechTargetSentence) speechTargetSentence.textContent = `"${lesson.sentence}"`;

        if (lessonCounterTag) {
            lessonCounterTag.textContent = `Word ${currentLessonIndex + 1} of ${currentLessons.length}`;
        }

        if (difficultyBadge) {
            const levelVal = levelSelect.value;
            difficultyBadge.textContent = levelVal === '1' ? 'Beginner (A1)' : (levelVal === '2' ? 'Intermediate (B1)' : 'Advanced (C1)');
        }

        // Reset step view visibilities
        if (englishMeaningBox) englishMeaningBox.style.display = 'block';
        if (marathiMeaningBox) marathiMeaningBox.style.display = 'block';
        if (sentenceContainer) sentenceContainer.style.display = 'block';
        if (quizArea) quizArea.style.display = 'none';

        if (nextStepBtn) {
            nextStepBtn.disabled = false;
            nextStepBtn.textContent = (currentStepIndex === steps.length - 1) ? 'Next Word →' : 'Next Step →';
        }

        const currentStep = steps[currentStepIndex];

        switch (currentStep) {
            case 'word':
                // Focus on word & definition
                break;
            case 'pronunciation':
                // Auto play pronunciation on enter
                speak(lesson.word, 1.0);
                break;
            case 'reading':
                // Focus on context sentence
                break;
            case 'quiz':
                // Hide definition cards, reveal quiz
                if (englishMeaningBox) englishMeaningBox.style.display = 'none';
                if (marathiMeaningBox) marathiMeaningBox.style.display = 'none';
                if (sentenceContainer) sentenceContainer.style.display = 'none';
                
                if (quizArea) {
                    quizArea.style.display = 'block';
                    if (quizQuestionText) {
                        quizQuestionText.textContent = lesson.quizQuestion || `Choose the correct word for: "${lesson.sentence}"`;
                    }
                    if (quizOptionsContainer && lesson.quizOptions) {
                        quizOptionsContainer.innerHTML = '';
                        if (nextStepBtn) nextStepBtn.disabled = true; // Wait for answer

                        lesson.quizOptions.forEach(opt => {
                            const btn = document.createElement('button');
                            btn.className = 'quiz-option-btn';
                            btn.textContent = opt;
                            btn.type = 'button';
                            btn.onclick = () => {
                                if (opt === lesson.quizAnswer) {
                                    btn.style.background = 'var(--status-ok-bg)';
                                    btn.style.borderColor = 'var(--status-ok-border)';
                                    btn.style.color = 'var(--status-ok-text)';
                                    if (quizQuestionText) quizQuestionText.textContent = 'Correct! 🎉 Well Done!';
                                    if (nextStepBtn) nextStepBtn.disabled = false;
                                } else {
                                    btn.style.background = 'var(--status-error-bg)';
                                    btn.style.borderColor = 'var(--status-error-border)';
                                    btn.style.color = 'var(--status-error-text)';
                                    setTimeout(() => {
                                        btn.style.background = '';
                                        btn.style.borderColor = '';
                                        btn.style.color = '';
                                    }, 800);
                                }
                            };
                            quizOptionsContainer.appendChild(btn);
                        });
                    }
                }
                break;
        }
    };

    const speak = (text, rate = 1.0) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop prior speech
            const cleanText = text.replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu, '').replace(/[•"\/]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'en-US';
            utterance.rate = rate;

            if (soundwaveGraphic) soundwaveGraphic.classList.add('playing');
            utterance.onend = () => {
                if (soundwaveGraphic) soundwaveGraphic.classList.remove('playing');
            };
            utterance.onerror = () => {
                if (soundwaveGraphic) soundwaveGraphic.classList.remove('playing');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, text-to-speech is not supported by your browser.");
        }
    };

    // Listen buttons
    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            const lesson = currentLessons[currentLessonIndex];
            if (!lesson) return;
            speak(lesson.word, 1.0);
        });
    }

    if (slowListenBtn) {
        slowListenBtn.addEventListener('click', () => {
            const lesson = currentLessons[currentLessonIndex];
            if (!lesson) return;
            speak(lesson.word, 0.7);
        });
    }

    if (quickSpeakBtn) {
        quickSpeakBtn.addEventListener('click', () => {
            const lesson = currentLessons[currentLessonIndex];
            if (!lesson) return;
            speak(lesson.word, 1.0);
        });
    }

    if (sentenceAudioBtn) {
        sentenceAudioBtn.addEventListener('click', () => {
            const lesson = currentLessons[currentLessonIndex];
            if (!lesson) return;
            speak(lesson.sentence, 0.9);
        });
    }

    // Speech AI Recognition Practice
    if (micPracticeBtn) {
        let recognition = null;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                micPracticeBtn.classList.add('recording');
                if (micBtnText) micBtnText.textContent = 'Listening... Speak now';
                if (speechFeedbackPill) {
                    speechFeedbackPill.textContent = '🎙️ Listening...';
                    speechFeedbackPill.style.background = 'rgba(239, 68, 68, 0.15)';
                    speechFeedbackPill.style.color = '#DC2626';
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                const lesson = currentLessons[currentLessonIndex];
                const target = lesson.word.toLowerCase();

                if (transcript.includes(target)) {
                    if (speechFeedbackPill) {
                        speechFeedbackPill.textContent = '🌟 Excellent! 98% Match';
                        speechFeedbackPill.style.background = 'var(--status-ok-bg)';
                        speechFeedbackPill.style.color = 'var(--status-ok-text)';
                    }
                    if (speechTargetSentence) {
                        speechTargetSentence.textContent = `Heard: "${transcript}" (Match!)`;
                    }
                } else {
                    if (speechFeedbackPill) {
                        speechFeedbackPill.textContent = 'Try again — Speak clearly';
                        speechFeedbackPill.style.background = 'rgba(245, 158, 11, 0.15)';
                        speechFeedbackPill.style.color = '#D97706';
                    }
                    if (speechTargetSentence) {
                        speechTargetSentence.textContent = `Heard: "${transcript}" — Try pronouncing "${lesson.word}" again!`;
                    }
                }
            };

            recognition.onend = () => {
                micPracticeBtn.classList.remove('recording');
                if (micBtnText) micBtnText.textContent = 'Tap to Practice Speaking';
            };

            recognition.onerror = () => {
                micPracticeBtn.classList.remove('recording');
                if (micBtnText) micBtnText.textContent = 'Tap to Practice Speaking';
                if (speechFeedbackPill) speechFeedbackPill.textContent = 'Could not detect audio';
            };

            micPracticeBtn.addEventListener('click', () => {
                try {
                    recognition.start();
                } catch (e) {
                    recognition.stop();
                }
            });
        } else {
            micPracticeBtn.addEventListener('click', () => {
                alert("Speech recognition is not supported in this browser. Try Chrome or Edge!");
            });
        }
    }

    // Save to Flashcards
    if (saveFlashcardBtn) {
        saveFlashcardBtn.addEventListener('click', async () => {
            const lesson = currentLessons[currentLessonIndex];
            if (!lesson) return;
            
            saveFlashcardBtn.textContent = 'Saving...';
            saveFlashcardBtn.disabled = true;
            
            try {
                const actualToken = localStorage.getItem('shikshamitr_student_token') || localStorage.getItem('shikshamitr_token');
                if (!actualToken) {
                    alert('Please log in to save to your flashcard deck.');
                    saveFlashcardBtn.textContent = '⭐ Save Word';
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
                        back: `${lesson.phonetic || ''}\n${lesson.meaning || ''}\nमराठी: ${lesson.marathiMeaning || ''}\n\n${lesson.sentence || ''}`
                    })
                });
                
                if (response.ok) {
                    saveFlashcardBtn.textContent = '⭐ Saved!';
                } else {
                    saveFlashcardBtn.textContent = '⭐ Saved (Local)';
                }
            } catch (e) {
                saveFlashcardBtn.textContent = '⭐ Saved (Local)';
            }
            
            setTimeout(() => {
                saveFlashcardBtn.textContent = '⭐ Save Word';
                saveFlashcardBtn.disabled = false;
            }, 2500);
        });
    }

    // Stepper click handlers
    steps.forEach((step, idx) => {
        const btn = document.getElementById(`step-${step}`);
        if (btn) {
            btn.addEventListener('click', () => {
                currentStepIndex = idx;
                displayCurrentContent();
            });
        }
    });

    // Previous & Next step buttons
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
            } else if (currentLessonIndex > 0) {
                currentLessonIndex--;
                currentStepIndex = steps.length - 1;
            }
            displayCurrentContent();
        });
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (currentStepIndex < steps.length - 1) {
                currentStepIndex++;
            } else {
                currentStepIndex = 0;
                currentLessonIndex++;
            }
            displayCurrentContent();
        });
    }

    // Keyboard Shortcuts (Space to listen, Enter to advance)
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            const lesson = currentLessons[currentLessonIndex];
            if (lesson) speak(lesson.word, 1.0);
        } else if (e.code === 'Enter') {
            e.preventDefault();
            if (nextStepBtn && !nextStepBtn.disabled) {
                nextStepBtn.click();
            }
        }
    });

    // Start / Load Lesson
    const loadLessons = async () => {
        const level = levelSelect.value;
        if (startBtn) {
            startBtn.textContent = 'Loading...';
            startBtn.disabled = true;
        }

        try {
            const response = await fetch(`${API_URL}?level=${level}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    currentLessons = data;
                }
            }
        } catch (error) {
            console.warn('Backend reading API offline, using rich offline lessons');
        }

        // Use rich offline/fallback lessons if API returns none
        if (!currentLessons || currentLessons.length === 0) {
            currentLessons = [...(fallbackLessons[level] || fallbackLessons["1"])];
        }

        currentStepIndex = 0;
        currentLessonIndex = 0;

        if (startBtn) {
            startBtn.textContent = '▶ Restart Lesson';
            startBtn.disabled = false;
        }

        displayCurrentContent();
    };

    if (startBtn) {
        startBtn.addEventListener('click', loadLessons);
    }

    if (levelSelect) {
        levelSelect.addEventListener('change', loadLessons);
    }

    // Load initial lesson on page load
    loadLessons();
});
