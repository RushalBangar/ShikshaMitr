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
    
    if (!actualToken) {
        window.location.href = 'index.html';
        return;
    }

    const deckView = document.getElementById('deck-view');
    const studyView = document.getElementById('study-view');
    const deckList = document.getElementById('deck-list');
    
    // Faculty controls
    if (userRole === 'faculty') {
        const createForm = document.getElementById('faculty-create-deck');
        if (createForm) createForm.style.display = 'block';
    }

    let currentDeckId = null;
    let dueCards = [];
    let currentCardIndex = 0;
    
    // Load Decks
    async function loadDecks() {
        try {
            const res = await fetch(`${API_URL}/flashcards/decks`);
            if (res.ok) {
                const decks = await res.json();
                deckList.innerHTML = '';
                if (decks.length === 0) {
                    deckList.innerHTML = '<p>No flashcard decks available.</p>';
                    return;
                }
                decks.forEach(deck => {
                    const card = document.createElement('div');
                    card.className = 'deck-card';
                    card.innerHTML = `
                        <h4>${deck.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">${deck.subject} • ${deck.cards ? deck.cards.length : 0} Cards</p>
                        <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="startStudy('${deck.id}')">Study Now</button>
                    `;
                    deckList.appendChild(card);
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    window.startStudy = async (deckId) => {
        try {
            const res = await fetch(`${API_URL}/flashcards/decks/${deckId}/study`, {
                headers: { 'Authorization': `Bearer ${actualToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                document.getElementById('study-deck-title').textContent = data.title;
                dueCards = data.due_cards;
                currentDeckId = deckId;
                currentCardIndex = 0;
                
                deckView.style.display = 'none';
                studyView.style.display = 'block';
                
                showNextCard();
            } else {
                alert("Failed to load study session.");
            }
        } catch(e) {
            console.error(e);
        }
    };

    window.closeStudyView = () => {
        studyView.style.display = 'none';
        deckView.style.display = 'block';
        loadDecks();
    };

    function showNextCard() {
        const flashcard = document.getElementById('flashcard');
        const controls = document.getElementById('study-controls');
        const hint = document.getElementById('flip-hint');
        
        flashcard.classList.remove('flipped');
        controls.style.display = 'none';
        hint.style.display = 'block';
        
        const progressEl = document.getElementById('study-progress');
        progressEl.textContent = `Cards Due: ${dueCards.length - currentCardIndex}`;
        
        if (currentCardIndex >= dueCards.length) {
            document.getElementById('card-front').innerHTML = `<h3>You're all caught up! 🎉</h3><p>Check back later for more reviews.</p>`;
            document.getElementById('card-back').innerHTML = ``;
            hint.style.display = 'none';
            flashcard.onclick = null;
            return;
        }

        const card = dueCards[currentCardIndex];
        document.getElementById('card-front').innerHTML = `<h3>${card.front}</h3>`;
        document.getElementById('card-back').innerHTML = `<h3>${card.back}</h3>`;
        
        flashcard.onclick = window.flipCard;
    }

    window.flipCard = () => {
        const flashcard = document.getElementById('flashcard');
        if (currentCardIndex >= dueCards.length) return;
        
        flashcard.classList.toggle('flipped');
        
        const isFlipped = flashcard.classList.contains('flipped');
        document.getElementById('study-controls').style.display = isFlipped ? 'flex' : 'none';
        document.getElementById('flip-hint').style.display = isFlipped ? 'none' : 'block';
    };

    window.submitRating = async (rating) => {
        if (currentCardIndex >= dueCards.length) return;
        const card = dueCards[currentCardIndex];
        
        try {
            await fetch(`${API_URL}/flashcards/decks/${currentDeckId}/review/${card.card_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${actualToken}`
                },
                body: JSON.stringify({ rating })
            });
            
            // Move to next card
            currentCardIndex++;
            showNextCard();
            
        } catch (e) {
            console.error(e);
        }
    };

    // Faculty deck creation logic
    window.addCardInput = () => {
        const container = document.getElementById('cards-container');
        const div = document.createElement('div');
        div.className = 'card-input';
        div.style.cssText = 'display: flex; gap: 1rem;';
        div.innerHTML = `
            <input type="text" placeholder="Front (Question)" class="form-input" style="flex:1" required>
            <input type="text" placeholder="Back (Answer)" class="form-input" style="flex:1" required>
            <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()">X</button>
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
                alert("Add at least one card.");
                return;
            }
            
            try {
                const res = await fetch(`${API_URL}/flashcards/decks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${actualToken}`
                    },
                    body: JSON.stringify({ title, subject, cards })
                });
                
                if (res.ok) {
                    createForm.reset();
                    document.getElementById('cards-container').innerHTML = `
                        <div class="card-input" style="display: flex; gap: 1rem;">
                            <input type="text" placeholder="Front (Question)" class="form-input" style="flex:1" required>
                            <input type="text" placeholder="Back (Answer)" class="form-input" style="flex:1" required>
                        </div>
                    `;
                    alert("Deck created successfully!");
                    loadDecks();
                } else {
                    alert("Failed to create deck.");
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    loadDecks();
});
