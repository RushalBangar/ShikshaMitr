document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BACKEND_BASE_URL = IS_LOCAL ? 'http://localhost:8000' : 'https://shikshamitr.onrender.com';
    const API_URL = `${BACKEND_BASE_URL}/api`;
    
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (!token) {
        window.location.href = 'student-login.html';
        return;
    }

    const postsList = document.getElementById('posts-list');
    const newPostForm = document.getElementById('new-post-form');

    async function fetchPosts() {
        try {
            const res = await fetch(`${API_URL}/forum/posts`);
            if (res.ok) {
                const posts = await res.json();
                renderPosts(posts);
            }
        } catch (e) {
            console.error(e);
        }
    }

    function renderPosts(posts) {
        postsList.innerHTML = '';
        posts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString();
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-header">
                    <div>
                        <span class="badge">${post.subject}</span>
                        <div class="post-title" onclick="toggleReplies('${post.id}')">${post.title}</div>
                    </div>
                    <div class="post-meta">By ${post.author_username} on ${date} • ${post.reply_count || 0} replies</div>
                </div>
                <p style="margin-bottom: 1rem;">${post.content}</p>
                <button class="btn btn-secondary" onclick="toggleReplies('${post.id}')">View Replies</button>
                <div id="replies-${post.id}" class="reply-section">
                    <div id="reply-list-${post.id}">Loading replies...</div>
                    <div class="reply-input-group">
                        <input type="text" id="reply-input-${post.id}" class="reply-input" placeholder="Write a reply...">
                        <button class="btn btn-primary" onclick="submitReply('${post.id}')">Post</button>
                    </div>
                </div>
            `;
            postsList.appendChild(card);
        });
    }

    window.toggleReplies = async (postId) => {
        const section = document.getElementById(`replies-${postId}`);
        if (section.style.display === 'block') {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            await loadReplies(postId);
        }
    };

    window.loadReplies = async (postId) => {
        const listDiv = document.getElementById(`reply-list-${postId}`);
        try {
            const res = await fetch(`${API_URL}/forum/posts/${postId}/replies`);
            if (res.ok) {
                const replies = await res.json();
                listDiv.innerHTML = '';
                if (replies.length === 0) {
                    listDiv.innerHTML = '<p class="post-meta">No replies yet.</p>';
                    return;
                }
                replies.forEach(reply => {
                    const rDiv = document.createElement('div');
                    rDiv.className = `reply-card ${reply.is_verified ? 'verified' : ''}`;
                    
                    let verifyBtn = '';
                    if (userRole === 'faculty' && !reply.is_verified) {
                        verifyBtn = `<button class="btn-verify" onclick="verifyReply('${postId}', '${reply.id}')">Verify Answer (Awards Points)</button>`;
                    }
                    
                    rDiv.innerHTML = `
                        <div class="post-meta" style="margin-bottom:0.5rem; color:var(--text-primary);">
                            <strong>${reply.author_username}</strong> 
                            ${reply.is_verified ? '<span class="verified-badge">✓ Verified Answer</span>' : ''}
                        </div>
                        <p style="margin: 0;">${reply.content}</p>
                        ${verifyBtn}
                    `;
                    listDiv.appendChild(rDiv);
                });
            }
        } catch (e) {
            console.error(e);
            listDiv.innerHTML = '<p>Error loading replies.</p>';
        }
    };

    window.submitReply = async (postId) => {
        const input = document.getElementById(`reply-input-${postId}`);
        const content = input.value.trim();
        if (!content) return;

        try {
            const res = await fetch(`${API_URL}/forum/posts/${postId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await loadReplies(postId);
            } else {
                alert("Failed to verify reply. Are you logged in as faculty?");
            }
        } catch (e) {
            console.error(e);
        }
    };

    newPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const subject = document.getElementById('post-subject').value;
        const content = document.getElementById('post-content').value;

        try {
            const res = await fetch(`${API_URL}/forum/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, subject, content })
            });
            if (res.ok) {
                newPostForm.reset();
                fetchPosts();
            } else {
                alert("Failed to create post.");
            }
        } catch(e) {
            console.error(e);
        }
    });

    fetchPosts();
});
