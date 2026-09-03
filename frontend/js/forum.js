document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : 'https://shikshamitr.onrender.com';
    const API_URL = `${BACKEND_BASE_URL}/api`;
    
    const token = localStorage.getItem('token');
    const actualToken = token || localStorage.getItem('shikshamitr_student_token') || localStorage.getItem('shikshamitr_faculty_token');
    let userRole = localStorage.getItem('role');
    if (!userRole) {
        userRole = localStorage.getItem('shikshamitr_faculty_token') ? 'faculty' : 'student';
    }

    const postsList = document.getElementById('posts-list');
    const newPostForm = document.getElementById('new-post-form');
    const searchInput = document.getElementById('forum-search-input');
    const subjectFilters = document.querySelectorAll('.subject-pill');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const triggerAskBtn = document.getElementById('trigger-ask-btn');

    let currentSubjectFilter = 'all';
    let currentTabFilter = 'trending';

    // Upvote interaction
    window.upvotePost = (btn) => {
        const countSpan = btn.querySelector('.vote-count');
        if (!countSpan) return;
        const current = parseInt(countSpan.textContent, 10);
        const isVoted = btn.classList.contains('voted');
        if (isVoted) {
            btn.classList.remove('voted');
            countSpan.textContent = current - 1;
        } else {
            btn.classList.add('voted');
            countSpan.textContent = current + 1;
        }
    };

    // Toggle reply section
    window.toggleReplies = async (postId) => {
        const section = document.getElementById(`replies-${postId}`);
        if (!section) return;
        if (section.style.display === 'block') {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            if (postId.startsWith('sample-')) {
                // local sample post
            } else {
                await loadReplies(postId);
            }
        }
    };

    // Submit sample reply
    window.submitSampleReply = (postId) => {
        const input = document.getElementById(`reply-input-${postId}`);
        if (!input || !input.value.trim()) return;
        
        const repliesSection = document.getElementById(`replies-${postId}`);
        const replyCard = document.createElement('div');
        replyCard.className = 'reply-card';
        replyCard.innerHTML = `
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                <strong style="color: var(--text-primary);">You</strong> • Just now
            </div>
            <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">${input.value.trim()}</p>
        `;
        repliesSection.insertBefore(replyCard, input.parentElement);
        input.value = '';
    };

    // Load API replies
    window.loadReplies = async (postId) => {
        const listDiv = document.getElementById(`reply-list-${postId}`);
        if (!listDiv) return;
        try {
            const res = await fetch(`${API_URL}/forum/posts/${postId}/replies`);
            if (res.ok) {
                const replies = await res.json();
                listDiv.innerHTML = '';
                if (replies.length === 0) {
                    listDiv.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted);">No replies yet. Be the first to help!</p>';
                    return;
                }
                replies.forEach(reply => {
                    const rDiv = document.createElement('div');
                    rDiv.className = `reply-card ${reply.is_verified ? 'verified' : ''}`;
                    
                    let verifyBtn = '';
                    if (userRole === 'faculty' && !reply.is_verified) {
                        verifyBtn = `<button class="btn btn-sm btn-ghost" onclick="verifyReply('${postId}', '${reply.id}')" style="margin-top:0.5rem; color:#059669; font-weight:700;">✓ Verify Answer (+20 Karma)</button>`;
                    }
                    
                    rDiv.innerHTML = `
                        <div style="font-size:0.8rem; margin-bottom:0.35rem; color:var(--text-primary);">
                            <strong>${reply.author_username}</strong> 
                            ${reply.is_verified ? '<span class="class-badge" style="background:var(--status-ok-bg); color:var(--status-ok-text); font-size:0.68rem; margin-left:0.3rem;">✓ Faculty Verified</span>' : ''}
                        </div>
                        <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">${reply.content}</p>
                        ${verifyBtn}
                    `;
                    listDiv.appendChild(rDiv);
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    window.submitReply = async (postId) => {
        const input = document.getElementById(`reply-input-${postId}`);
        const content = input ? input.value.trim() : '';
        if (!content) return;

        if (!actualToken) {
            alert("Please log in to submit replies.");
            window.location.href = 'student-login.html';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/forum/posts/${postId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${actualToken}`
                },
                body: JSON.stringify({ content })
            });
            if (res.ok) {
                input.value = '';
                await loadReplies(postId);
            } else {
                alert("Error posting reply");
            }
        } catch (e) {
            console.error(e);
        }
    };

    window.verifyReply = async (postId, replyId) => {
        try {
            const res = await fetch(`${API_URL}/forum/posts/${postId}/replies/${replyId}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${actualToken}` }
            });
            if (res.ok) {
                await loadReplies(postId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Filter Posts by Search & Subject
    const applyFilters = () => {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const articles = postsList.querySelectorAll('article.post-card');

        articles.forEach(article => {
            const title = (article.querySelector('.post-card-title')?.textContent || '').toLowerCase();
            const body = (article.querySelector('.post-body-snippet')?.textContent || '').toLowerCase();
            const subject = article.getAttribute('data-subject') || '';
            const status = article.getAttribute('data-status') || '';

            let matchesQuery = !query || title.includes(query) || body.includes(query);
            let matchesSubject = currentSubjectFilter === 'all' || subject.toLowerCase() === currentSubjectFilter.toLowerCase();
            
            let matchesTab = true;
            if (currentTabFilter === 'unanswered') {
                matchesTab = status === 'unanswered';
            } else if (currentTabFilter === 'faculty') {
                matchesTab = status === 'solved';
            }

            if (matchesQuery && matchesSubject && matchesTab) {
                article.style.display = 'block';
            } else {
                article.style.display = 'none';
            }
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Keyboard shortcut Ctrl+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    // Subject Pills Filtering
    subjectFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            subjectFilters.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentSubjectFilter = pill.getAttribute('data-subject') || 'all';
            applyFilters();
        });
    });

    // Tab buttons filtering
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTabFilter = btn.getAttribute('data-tab') || 'trending';
            applyFilters();
        });
    });

    // Trigger Ask Question focus
    if (triggerAskBtn) {
        triggerAskBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('post-title');
            const drawer = document.getElementById('ask-drawer');
            if (drawer) {
                drawer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (titleInput) {
                setTimeout(() => titleInput.focus(), 300);
            }
        });
    }

    // Form Submission for New Doubt
    if (newPostForm) {
        newPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value;
            const subject = document.getElementById('post-subject').value;
            const content = document.getElementById('post-content').value;

            // Optimistic prepend to UI
            const newArticle = document.createElement('article');
            newArticle.className = 'post-card unanswered-card';
            newArticle.setAttribute('data-subject', subject);
            newArticle.setAttribute('data-status', 'unanswered');
            const uniqueId = `post-${Date.now()}`;

            newArticle.innerHTML = `
                <div class="post-top-meta">
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <span class="badge badge-standard">${subject} • Class 10 CBSE</span>
                        <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #D97706;">⏳ Needs Answers (+15 XP)</span>
                    </div>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">Just now</span>
                </div>
                <h2 class="post-card-title" onclick="toggleReplies('${uniqueId}')">${title}</h2>
                <p class="post-body-snippet">${content}</p>
                <div class="author-badge-row">
                    <span class="user-mini-avatar" style="background: var(--primary); color: #fff;">YOU</span>
                    <strong style="color: var(--text-primary);">You (Student)</strong>
                    <span>• Just now</span>
                </div>
                <div class="post-action-footer">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button class="upvote-btn" onclick="upvotePost(this)" type="button">
                            <span>▲</span>
                            <span class="vote-count">1</span>
                            <span>Upvote</span>
                        </button>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">💬 0 Answers</span>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="toggleReplies('${uniqueId}')">View Discussion ↓</button>
                </div>
                <div id="replies-${uniqueId}" class="reply-section">
                    <div class="reply-input-group">
                        <input type="text" id="reply-input-${uniqueId}" class="form-control" placeholder="Write a reply..." style="font-size: 16px;">
                        <button class="btn btn-primary btn-sm" onclick="submitSampleReply('${uniqueId}')">Reply</button>
                    </div>
                </div>
            `;

            postsList.prepend(newArticle);
            newPostForm.reset();
            alert("Your academic question has been published to ShikshaMitr Community! (+10 Karma)");
            newArticle.scrollIntoView({ behavior: 'smooth' });

            // Sync with backend if authenticated
            if (actualToken) {
                try {
                    await fetch(`${API_URL}/forum/posts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${actualToken}`
                        },
                        body: JSON.stringify({ title, subject, content })
                    });
                } catch(err) {
                    console.warn("Backend offline, post kept locally in session");
                }
            }
        });
    }

    // Fetch live backend posts if available and prepend
    async function fetchBackendPosts() {
        try {
            const res = await fetch(`${API_URL}/forum/posts`);
            if (res.ok) {
                const posts = await res.json();
                if (Array.isArray(posts) && posts.length > 0) {
                    posts.forEach(post => {
                        const date = new Date(post.created_at || Date.now()).toLocaleDateString();
                        const card = document.createElement('article');
                        card.className = 'post-card';
                        card.setAttribute('data-subject', post.subject || 'General');
                        card.innerHTML = `
                            <div class="post-top-meta">
                                <span class="badge badge-standard">${post.subject || 'Academic'} • Community</span>
                                <span style="font-size: 0.78rem; color: var(--text-muted);">${date}</span>
                            </div>
                            <h2 class="post-card-title" onclick="toggleReplies('${post.id}')">${post.title}</h2>
                            <p class="post-body-snippet">${post.content}</p>
                            <div class="author-badge-row">
                                <span class="user-mini-avatar">${(post.author_username || 'S')[0].toUpperCase()}</span>
                                <strong style="color: var(--text-primary);">${post.author_username || 'Student'}</strong>
                            </div>
                            <div class="post-action-footer">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <button class="upvote-btn" onclick="upvotePost(this)" type="button">
                                        <span>▲</span>
                                        <span class="vote-count">${post.upvotes || 0}</span>
                                        <span>Upvotes</span>
                                    </button>
                                    <span style="font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;" onclick="toggleReplies('${post.id}')">
                                        💬 ${post.reply_count || 0} Answers
                                    </span>
                                </div>
                                <button class="btn btn-ghost btn-sm" onclick="toggleReplies('${post.id}')">View Replies ↓</button>
                            </div>
                            <div id="replies-${post.id}" class="reply-section">
                                <div id="reply-list-${post.id}">Loading replies...</div>
                                <div class="reply-input-group">
                                    <input type="text" id="reply-input-${post.id}" class="form-control" placeholder="Write a reply..." style="font-size: 16px;">
                                    <button class="btn btn-primary btn-sm" onclick="submitReply('${post.id}')">Reply</button>
                                </div>
                            </div>
                        `;
                        postsList.prepend(card);
                    });
                }
            }
        } catch (e) {
            // Live backend unavailable; fallback posts are already rendered
        }
    }

    fetchBackendPosts();
});
