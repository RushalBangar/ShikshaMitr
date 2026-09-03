document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : 'https://shikshamitr.onrender.com';
    const API_URL = `${BACKEND_BASE_URL}/api`;
    
    const token = localStorage.getItem('token');
    let userRole = localStorage.getItem('role');
    if (!userRole) {
        userRole = localStorage.getItem('shikshamitr_faculty_token') ? 'faculty' : 'student';
    }
    const actualToken = token || localStorage.getItem('shikshamitr_student_token') || localStorage.getItem('shikshamitr_faculty_token');

    // Faculty controls
    if (userRole === 'faculty') {
        const createForm = document.getElementById('faculty-create-deck');
        if (createForm) createForm.style.display = 'block';
    }

    // Curated Class 10 NCERT Decks with step-by-step solutions and Marathi translation keys
    const defaultDecks = {
        'deck-math': {
            id: 'deck-math',
            title: 'Mathematics • Quadratic Equations & Roots',
            subject: 'Mathematics',
            topic: 'Algebraic Identities & Roots',
            cards: [
                {
                    promptNum: 'Prompt #10.1',
                    question: 'What is √144, and what are the roots of x² − 144 = 0?',
                    hint: 'Recall integer squares: 10² = 100, 11² = 121, 12² = ... Quadratics yield both positive and negative solutions.',
                    answerTitle: 'Answer: ±12',
                    solution: 'The principal square root is positive: √144 = 12 (since 12 × 12 = 144). For the quadratic equation: x² − 144 = 0 ⇒ x² = 144 ⇒ x = ±√144. Therefore, the two distinct roots are x = +12 and x = −12.',
                    vernacular: '144 चे मुख्य वर्गमूळ 12 आहे. वर्गसमीकरण x² − 144 = 0 सोडवताना x ची दोन मुळे मिळतात: x = +12 आणि x = −12.',
                    topic: 'Algebraic Roots',
                    difficulty: 'Medium Difficulty'
                },
                {
                    promptNum: 'Prompt #10.2',
                    question: 'What is the quadratic formula used to find roots of ax² + bx + c = 0?',
                    hint: 'It involves calculating the discriminant: D = b² − 4ac.',
                    answerTitle: 'Answer: x = (−b ± √(b² − 4ac)) / (2a)',
                    solution: 'For any quadratic equation ax² + bx + c = 0 where a ≠ 0, the solutions are given by x = (−b ± √D) / 2a, where the discriminant D = b² − 4ac determines whether the roots are real or complex.',
                    vernacular: 'कोणत्याही वर्गसमीकरणाची मुळे काढण्याचे सूत्र: x = (−b ± √(b² − 4ac)) / (2a). यात b² − 4ac ला विवेचक (Discriminant) म्हणतात.',
                    topic: 'Quadratic Formula',
                    difficulty: 'Core Formula'
                },
                {
                    promptNum: 'Prompt #10.3',
                    question: 'If the discriminant D = b² − 4ac > 0, what is the nature of the roots?',
                    hint: 'Consider whether the square root yields two distinct real numbers.',
                    answerTitle: 'Answer: Two Distinct Real Roots',
                    solution: 'When D > 0, √D is a real positive number. Adding and subtracting it yields two real and unequal solutions: x₁ = (−b + √D)/2a and x₂ = (−b − √D)/2a.',
                    vernacular: 'जेव्हा विवेचक D > 0 असतो, तेव्हा वर्गसमीकरणाला दोन भिन्न आणि वास्तव (Real and Distinct) मुळे मिळतात.',
                    topic: 'Nature of Roots',
                    difficulty: 'Concept Test'
                },
                {
                    promptNum: 'Prompt #10.4',
                    question: 'State the Pythagorean trigonometric identity relating sin²θ and cos²θ.',
                    hint: 'Think about a right-angled triangle where opposite² + adjacent² = hypotenuse².',
                    answerTitle: 'Answer: sin²θ + cos²θ = 1',
                    solution: 'By definition in a unit circle or right triangle: (opp/hyp)² + (adj/hyp)² = (opp² + adj²)/hyp² = hyp²/hyp² = 1. Therefore, sin²θ + cos²θ = 1 for all angles θ.',
                    vernacular: 'त्रिकोणमितीचे मूलभूत नित्यसमीकरण: sin²θ + cos²θ = 1.',
                    topic: 'Trigonometry',
                    difficulty: 'Essential Formula'
                }
            ]
        },
        'deck-science': {
            id: 'deck-science',
            title: 'Chemical Reactions & Equations',
            subject: 'Science',
            topic: 'Chemical Changes & Stoichiometry',
            cards: [
                {
                    promptNum: 'Prompt #1.1',
                    question: 'What is a combination reaction? Give one daily example.',
                    hint: 'Two or more reactants combine to form a single product.',
                    answerTitle: 'Answer: A + B → AB (Single Product)',
                    solution: 'A reaction in which two or more reactants combine to form a single new product. Example: Burning of coal (C + O₂ → CO₂) or slaking of lime (CaO + H₂O → Ca(OH)₂).',
                    vernacular: 'संयोग अभिक्रिया (Combination Reaction): ज्या अभिक्रियेत दोन किंवा अधिक अभिक्रियाकारकांपासून एकच उत्पादित मिळते. उदा. कळीच्या चुनखडीत पाणी मिसळणे.',
                    topic: 'Combination Reaction',
                    difficulty: 'High Frequency'
                },
                {
                    promptNum: 'Prompt #1.2',
                    question: 'What is the chemical formula of rust formed on iron?',
                    hint: 'Hydrated iron(III) oxide formed in the presence of oxygen and moisture.',
                    answerTitle: 'Answer: Fe₂O₃ · xH₂O',
                    solution: 'Rust is hydrated iron(III) oxide (Fe₂O₃·xH₂O). It forms when iron reacts with oxygen in the presence of water/humidity (4Fe + 3O₂ + 2xH₂O → 2Fe₂O₃·xH₂O).',
                    vernacular: 'गंज (Rust) चे रासायनिक सूत्र Fe₂O₃·xH₂O (हायड्रेटेड आयर्न ऑक्साइड) आहे. ते दमट हवेत लोखंडाचे ऑक्सिडीकरण झाल्यामुळे तयार होते.',
                    topic: 'Corrosion',
                    difficulty: 'Board Question'
                }
            ]
        },
        'deck-english': {
            id: 'deck-english',
            title: '100 Essential Vocabulary Words',
            subject: 'English',
            topic: 'Lexicon & Vocabulary',
            cards: [
                {
                    promptNum: 'Word #1',
                    question: 'What does "Diligent" mean, and use it in a sentence?',
                    hint: 'Someone who shows care and persistent effort in work.',
                    answerTitle: 'Answer: Hardworking, attentive, persistent',
                    solution: '"Diligent" means possessing or showing persistent care and conscientious effort. Example: "The diligent student revised her notes daily to score 95% in boards."',
                    vernacular: 'कष्टाळू, दक्ष, एकाग्रचित्त / मेहनती. उदा. "अभ्यासात कष्टाळू असणारा विद्यार्थी नक्कीच यशस्वी होतो."',
                    topic: 'Vocabulary',
                    difficulty: 'High Frequency'
                },
                {
                    promptNum: 'Word #2',
                    question: 'What is the meaning and phonetic pronunciation of "Perseverance"?',
                    hint: 'Pronounced /ˌpɜː.sɪˈvɪə.rəns/. Staying determined despite setbacks.',
                    answerTitle: 'Answer: Continued determination despite difficulty',
                    solution: 'Perseverance (/ˌpɜː.sɪˈvɪə.rəns/) means continuing to make effort to do or achieve something, even when this is difficult or takes a long time.',
                    vernacular: 'चिकाटी, जिद्द, अखंड प्रयत्न. उदा. "जिद्दीच्या आणि चिकाटीच्या बळावर तिने शिखर सर केले."',
                    topic: 'Vocabulary',
                    difficulty: 'Advanced Word'
                }
            ]
        },
        'deck-history': {
            id: 'deck-history',
            title: 'Indian National Movement',
            subject: 'Social Science',
            topic: 'Freedom Struggle & Milestones',
            cards: [
                {
                    promptNum: 'History #1',
                    question: 'In which year did the Dandi March (Salt Satyagraha) take place, and from where did it begin?',
                    hint: '1930, Sabarmati Ashram to the coastal village of Dandi.',
                    answerTitle: 'Answer: 1930, from Sabarmati Ashram',
                    solution: 'Mahatma Gandhi started the historic Salt March on 12 March 1930 from Sabarmati Ashram towards Dandi on the Gujarat coast, breaking the British salt law on 6 April 1930.',
                    vernacular: 'दांडी यात्रा १२ मार्च १९३० रोजी साबरमती आश्रमातून सुरू झाली आणि ६ एप्रिल १९३० रोजी मिठाचा सत्याग्रह करून गांधीजींनी मिठाचा कायदा मोडला.',
                    topic: 'Civil Disobedience',
                    difficulty: 'Core History'
                }
            ]
        }
    };

    let activeDeckKey = 'deck-math';
    let currentCards = defaultDecks['deck-math'].cards;
    let cardIdx = 0;
    let isFlipped = false;
    let isHintOpen = false;

    // Load deck content into UI
    const renderCard = () => {
        const deck = defaultDecks[activeDeckKey];
        if (!deck || !currentCards[cardIdx]) return;
        const card = currentCards[cardIdx];

        // Reset flip state
        isFlipped = false;
        isHintOpen = false;

        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');
        const flipStatusText = document.getElementById('flip-status-text');
        const hintContent = document.getElementById('hint-content');
        const hintBtnLabel = document.getElementById('hint-btn-label');

        if (cardFront) cardFront.style.display = 'flex';
        if (cardBack) cardBack.style.display = 'none';
        if (flipStatusText) flipStatusText.innerText = '👆 Click anywhere or press Space to reveal answer';
        if (hintContent) hintContent.style.display = 'none';
        if (hintBtnLabel) hintBtnLabel.innerText = 'Need a Clue? Show Hint';

        // Set card meta
        const studyDeckTitle = document.getElementById('study-deck-title');
        const studyProgress = document.getElementById('study-progress');
        const cardTopicTag = document.getElementById('card-topic-tag');
        const cardDifficultyTag = document.getElementById('card-difficulty-tag');
        const activeStudyModeLabel = document.getElementById('active-study-mode-label');

        if (studyDeckTitle) studyDeckTitle.textContent = deck.title;
        if (studyProgress) studyProgress.textContent = `Card ${cardIdx + 1} of ${currentCards.length}`;
        if (cardTopicTag) cardTopicTag.textContent = card.topic || deck.topic;
        if (cardDifficultyTag) cardDifficultyTag.textContent = card.difficulty || 'Medium Difficulty';
        if (activeStudyModeLabel) activeStudyModeLabel.textContent = `Study Mode: ${deck.title}`;

        // Set Question & Answer
        const promptNum = document.getElementById('card-prompt-num');
        const questionText = document.getElementById('card-question-text');
        const answerTitle = document.getElementById('card-answer-title');
        const solutionBox = document.getElementById('card-solution-box');
        const vernacularText = document.getElementById('card-vernacular-text');

        if (promptNum) promptNum.textContent = card.promptNum || `Prompt #${cardIdx + 1}`;
        if (questionText) questionText.innerHTML = card.question;
        if (answerTitle) answerTitle.textContent = card.answerTitle || 'Correct Answer';
        
        if (solutionBox) {
            solutionBox.innerHTML = `
                <strong style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; display: block; margin-bottom: 0.4rem;">Step-by-Step Proof</strong>
                <p style="margin: 0;">${card.solution}</p>
            `;
        }

        if (vernacularText) vernacularText.innerHTML = card.vernacular || '';
        if (hintContent) hintContent.innerHTML = `💡 <em>Hint: ${card.hint}</em>`;

        // Update progress bar
        const progressBar = document.getElementById('session-progress-bar');
        const progressText = document.getElementById('session-progress-text');
        if (progressBar && progressText) {
            const pct = Math.round(((cardIdx + 1) / currentCards.length) * 100);
            progressBar.style.width = `${pct}%`;
            progressText.textContent = `${cardIdx + 1} / ${currentCards.length} (${pct}%)`;
        }
    };

    window.flipCard = () => {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');
        const flipStatusText = document.getElementById('flip-status-text');

        isFlipped = !isFlipped;
        if (isFlipped) {
            if (cardFront) cardFront.style.display = 'none';
            if (cardBack) cardBack.style.display = 'flex';
            if (flipStatusText) flipStatusText.innerText = 'Tap card or press Space to view question again';
        } else {
            if (cardFront) cardFront.style.display = 'flex';
            if (cardBack) cardBack.style.display = 'none';
            if (flipStatusText) flipStatusText.innerText = '👆 Click anywhere or press Space to reveal answer';
        }
    };

    window.toggleHint = () => {
        const hintContent = document.getElementById('hint-content');
        const hintBtnLabel = document.getElementById('hint-btn-label');
        isHintOpen = !isHintOpen;
        if (hintContent) hintContent.style.display = isHintOpen ? 'block' : 'none';
        if (hintBtnLabel) hintBtnLabel.innerText = isHintOpen ? 'Hide Hint' : 'Need a Clue? Show Hint';
    };

    window.playCardAudio = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const card = currentCards[cardIdx];
            const cleanText = (card.question || '').replace(/[√²±_]/g, ' ');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
            showToast("Playing pronunciation...", "🔊");
        } else {
            showToast("Speech audio not supported in browser", "ℹ️");
        }
    };

    window.toggleBookmark = (btn) => {
        btn.classList.toggle('bookmarked');
        const isMarked = btn.classList.contains('bookmarked');
        showToast(isMarked ? "Card saved to bookmarks! ⭐" : "Bookmark removed", isMarked ? "⭐" : "🔖");
    };

    window.submitRating = (rating) => {
        const intervals = {
            1: "Card rescheduled in < 1 minute.",
            2: "Next review scheduled in 12 hours.",
            3: "Mastery retained! Next review in 2 days.",
            4: "Card mastered! Next review in 4 days."
        };
        showToast(intervals[rating], "✓");

        // Flip back if needed, then move to next card
        setTimeout(() => {
            if (cardIdx < currentCards.length - 1) {
                cardIdx++;
            } else {
                cardIdx = 0; // loop deck
                showToast("🎉 Deck review completed! Starting fresh cycle.", "🏆");
            }
            renderCard();
        }, 500);
    };

    window.navigateCard = (dir) => {
        if (dir === 'next') {
            cardIdx = (cardIdx + 1) % currentCards.length;
        } else {
            cardIdx = (cardIdx - 1 + currentCards.length) % currentCards.length;
        }
        renderCard();
    };

    window.shuffleCurrentDeck = () => {
        currentCards.sort(() => 0.5 - Math.random());
        cardIdx = 0;
        renderCard();
        showToast("Deck shuffled for active recall practice! 🔀", "🔀");
    };

    window.selectDeck = (deckKey) => {
        if (defaultDecks[deckKey]) {
            activeDeckKey = deckKey;
            currentCards = defaultDecks[deckKey].cards;
            cardIdx = 0;
            renderCard();

            // Highlight active deck card
            document.querySelectorAll('.deck-showcase-card').forEach(c => c.classList.remove('active-deck'));
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active-deck');
            }

            // Scroll to study view
            const studyView = document.getElementById('study-view');
            if (studyView) {
                studyView.scrollIntoView({ behavior: 'smooth' });
            }

            showToast(`Loaded ${defaultDecks[deckKey].title}`, "📚");
        }
    };

    window.filterDecks = (type, btn) => {
        document.querySelectorAll('.deck-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(`Filtering decks: ${type}`, "🔍");
    };

    function showToast(msg, icon = "✓") {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        if (toastIcon) toastIcon.textContent = icon;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2400);
    }

    // Keyboard navigation listener
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            window.flipCard();
        } else if (e.key === '1') {
            window.submitRating(1);
        } else if (e.key === '2') {
            window.submitRating(2);
        } else if (e.key === '3') {
            window.submitRating(3);
        } else if (e.key === '4') {
            window.submitRating(4);
        } else if (e.code === 'ArrowRight') {
            window.navigateCard('next');
        } else if (e.code === 'ArrowLeft') {
            window.navigateCard('prev');
        }
    });

    // Faculty deck creation handler
    window.addCardInput = () => {
        const container = document.getElementById('cards-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'card-input';
        div.style.cssText = 'display: flex; gap: 0.75rem; flex-wrap: wrap;';
        div.innerHTML = `
            <input type="text" placeholder="Front (Question)" class="form-control" style="flex:1; min-width: 180px; font-size: 16px;" required>
            <input type="text" placeholder="Back (Answer)" class="form-control" style="flex:1; min-width: 180px; font-size: 16px;" required>
            <button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()" style="color: var(--status-error-text);">✕</button>
        `;
        container.appendChild(div);
    };

    const createForm = document.getElementById('create-deck-form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('deck-title').value;
            const subject = document.getElementById('deck-subject').value;
            
            const cardInputs = document.querySelectorAll('.card-input');
            const cards = [];
            cardInputs.forEach(div => {
                const inputs = div.querySelectorAll('input');
                if (inputs[0].value && inputs[1].value) {
                    cards.push({ front: inputs[0].value, back: inputs[1].value });
                }
            });
            
            if (cards.length === 0) {
                alert("Please add at least one card.");
                return;
            }
            
            try {
                if (actualToken) {
                    await fetch(`${API_URL}/flashcards/decks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${actualToken}`
                        },
                        body: JSON.stringify({ title, subject, cards })
                    });
                }

                // Add to local deck view dynamically
                const newDeckKey = `deck-custom-${Date.now()}`;
                defaultDecks[newDeckKey] = {
                    id: newDeckKey,
                    title: title,
                    subject: subject,
                    topic: subject,
                    cards: cards.map((c, i) => ({
                        promptNum: `Card #${i + 1}`,
                        question: c.front,
                        hint: 'Custom teacher card clue',
                        answerTitle: 'Answer:',
                        solution: c.back,
                        vernacular: '',
                        topic: subject,
                        difficulty: 'Custom Deck'
                    }))
                };

                alert("Deck created successfully!");
                createForm.reset();
                window.selectDeck(newDeckKey);
            } catch(e) {
                console.error(e);
            }
        });
    }

    // Try loading online custom decks if user is logged in
    async function loadBackendDecks() {
        try {
            const res = await fetch(`${API_URL}/flashcards/decks`);
            if (res.ok) {
                const decks = await res.json();
                if (Array.isArray(decks) && decks.length > 0) {
                    decks.forEach(d => {
                        defaultDecks[d.id || d._id] = {
                            id: d.id || d._id,
                            title: d.title,
                            subject: d.subject,
                            topic: d.subject,
                            cards: (d.cards || []).map((c, idx) => ({
                                promptNum: `Card #${idx + 1}`,
                                question: c.front,
                                hint: 'Review notes for clue',
                                answerTitle: 'Answer:',
                                solution: c.back,
                                vernacular: '',
                                topic: d.subject,
                                difficulty: 'Teacher Deck'
                            }))
                        };
                    });
                }
            }
        } catch (e) {
            // Quietly fallback to rich local curriculum decks
        }
    }

    loadBackendDecks();
    renderCard();
});
