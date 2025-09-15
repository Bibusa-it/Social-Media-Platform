// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentPage = 1;
let isLoading = false;
let currentProfileUserId = null;

// API Base URL
const API_BASE = window.location.origin;

// Utility functions
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function getDefaultProfilePic() {
    return 'https://via.placeholder.com/150/667eea/ffffff?text=U';
}

// API functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication functions
async function register(userData) {
    try {
        const data = await apiCall('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('Account created successfully!', 'success');
        showApp();
        loadFeed();
        loadUserProfile();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function login(credentials) {
    try {
        const data = await apiCall('/api/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('Login successful!', 'success');
        showApp();
        loadFeed();
        loadUserProfile();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuth();
    showToast('Logged out successfully', 'info');
}

// UI functions
function showLoading() {
    document.getElementById('loading-screen').style.opacity = '1';
    document.getElementById('loading-screen').style.visibility = 'visible';
}

function hideLoading() {
    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('loading-screen').style.visibility = 'hidden';
    }, 500);
}

function showAuth() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Post functions
async function createPost(postData) {
    try {
        const formData = new FormData();
        formData.append('content', postData.content);
        
        if (postData.image) {
            formData.append('image', postData.image);
        }
        
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create post');
        }
        
        showToast('Post created successfully!', 'success');
        hideModal('create-post-modal');
        document.getElementById('post-form').reset();
        document.getElementById('image-preview').classList.add('hidden');
        loadFeed();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadFeed(page = 1) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        const data = await apiCall(`/api/posts?page=${page}&limit=10`);
        
        const postsContainer = document.getElementById('posts-container');
        
        if (page === 1) {
            postsContainer.innerHTML = '';
        }
        
        if (data.length === 0 && page === 1) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to share something!</p>
                </div>
            `;
            return;
        }
        
        data.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
        
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (data.length === 10) {
            loadMoreBtn.classList.remove('hidden');
            currentPage = page;
        } else {
            loadMoreBtn.classList.add('hidden');
        }
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        isLoading = false;
    }
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post.id;
    
    const profilePic = post.profile_picture || getDefaultProfilePic();
    const isLiked = post.is_liked ? 'liked' : '';
    const likeIcon = post.is_liked ? 'fas fa-heart' : 'far fa-heart';
    const isOwnPost = currentUser && post.user_id === currentUser.id;
    
    postDiv.innerHTML = `
        <div class="post-header">
            <img src="${profilePic}" alt="${post.username}" class="post-author-pic">
            <div class="post-author-info">
                <h4>${post.full_name || post.username}</h4>
                <span>@${post.username} • ${formatDate(post.created_at)}</span>
            </div>
            ${isOwnPost ? `<button class="delete-post-btn" onclick="deletePost(${post.id})" title="Delete post">
                <i class="fas fa-trash"></i>
            </button>` : ''}
        </div>
        <div class="post-content">${post.content}</div>
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
        <div class="post-actions">
            <div class="post-action ${isLiked}" onclick="toggleLike(${post.id})">
                <i class="${likeIcon}"></i>
                <span>${post.likes_count}</span>
            </div>
            <div class="post-action" onclick="toggleComments(${post.id})">
                <i class="far fa-comment"></i>
                <span>${post.comments_count}</span>
            </div>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comments-list"></div>
            <div class="add-comment">
                <input type="text" placeholder="Write a comment..." onkeypress="handleCommentSubmit(event, ${post.id})">
                <button onclick="addComment(${post.id})">Comment</button>
            </div>
        </div>
    `;
    
    return postDiv;
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiCall(`/api/posts/${postId}`, {
            method: 'DELETE'
        });
        
        // Remove the post from the DOM
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
        
        showToast('Post deleted successfully!', 'success');
        
        // Reload user profile if we're on a profile page
        if (currentProfileUserId === currentUser.id) {
            await loadUserProfile();
        }
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function toggleLike(postId) {
    try {
        const data = await apiCall(`/api/posts/${postId}/like`, {
            method: 'POST'
        });
        
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const likeAction = postElement.querySelector('.post-action');
        const likeIcon = likeAction.querySelector('i');
        const likeCount = likeAction.querySelector('span');
        
        if (data.liked) {
            likeAction.classList.add('liked');
            likeIcon.className = 'fas fa-heart';
        } else {
            likeAction.classList.remove('liked');
            likeIcon.className = 'far fa-heart';
        }
        
        // Update like count
        const currentCount = parseInt(likeCount.textContent);
        likeCount.textContent = data.liked ? currentCount + 1 : currentCount - 1;
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';
    
    if (!isVisible) {
        await loadComments(postId);
    }
    
    commentsSection.style.display = isVisible ? 'none' : 'block';
}

async function loadComments(postId) {
    try {
        const comments = await apiCall(`/api/posts/${postId}/comments`);
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment">
                <img src="${comment.profile_picture || getDefaultProfilePic()}" alt="${comment.username}" class="comment-author-pic">
                <div class="comment-content">
                    <div class="comment-author">${comment.full_name || comment.username}</div>
                    <div class="comment-text">${comment.content}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function addComment(postId) {
    const input = document.querySelector(`#comments-${postId} input`);
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        await apiCall(`/api/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        input.value = '';
        await loadComments(postId);
        
        // Update comment count
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const commentAction = postElement.querySelector('.post-action:last-child');
        const commentCount = commentAction.querySelector('span');
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = currentCount + 1;
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function handleCommentSubmit(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
}

// User profile functions
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const profile = await apiCall(`/api/users/${currentUser.id}`);
        
        // Update main profile card
        document.getElementById('main-username').textContent = profile.full_name || profile.username;
        document.getElementById('main-bio').textContent = profile.bio || 'No bio yet';
        document.getElementById('main-profile-pic').src = profile.profile_picture || getDefaultProfilePic();
        document.getElementById('nav-profile-pic').src = profile.profile_picture || getDefaultProfilePic();
        
        // Update stats
        document.getElementById('posts-count').textContent = profile.posts_count;
        document.getElementById('followers-count').textContent = profile.followers_count;
        document.getElementById('following-count').textContent = profile.following_count;
        
        // Load suggested users
        await loadSuggestedUsers();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadUserPosts(userId, page = 1) {
    try {
        const posts = await apiCall(`/api/users/${userId}/posts?page=${page}&limit=10`);
        const postsContainer = document.getElementById('profile-posts');
        
        if (page === 1) {
            postsContainer.innerHTML = '';
        }
        
        posts.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadUserFollowers(userId) {
    try {
        const followers = await apiCall(`/api/users/${userId}/followers`);
        const followersContainer = document.getElementById('profile-followers');
        
        followersContainer.innerHTML = followers.map(user => `
            <div class="suggested-user">
                <img src="${user.profile_picture || getDefaultProfilePic()}" alt="${user.username}" class="suggested-user-pic">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">${user.full_name || user.username}</div>
                    <div class="suggested-user-username">@${user.username}</div>
                </div>
                <button class="follow-btn ${user.is_following ? 'following' : ''}" onclick="toggleFollow(${user.id})">
                    ${user.is_following ? 'Following' : 'Follow'}
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadUserFollowing(userId) {
    try {
        const following = await apiCall(`/api/users/${userId}/following`);
        const followingContainer = document.getElementById('profile-following');
        
        followingContainer.innerHTML = following.map(user => `
            <div class="suggested-user">
                <img src="${user.profile_picture || getDefaultProfilePic()}" alt="${user.username}" class="suggested-user-pic">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">${user.full_name || user.username}</div>
                    <div class="suggested-user-username">@${user.username}</div>
                </div>
                <button class="follow-btn ${user.is_following ? 'following' : ''}" onclick="toggleFollow(${user.id})">
                    ${user.is_following ? 'Following' : 'Follow'}
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadSuggestedUsers() {
    try {
        const users = await apiCall('/api/users/suggested');
        const suggestedUsersContainer = document.getElementById('suggested-users-list');
        
        if (users.length === 0) {
            suggestedUsersContainer.innerHTML = '<div class="no-suggestions">No suggestions available</div>';
        } else {
            suggestedUsersContainer.innerHTML = users.map(user => `
                <div class="suggested-user">
                    <img src="${user.profile_picture || getDefaultProfilePic()}" alt="${user.username}" class="suggested-user-pic">
                    <div class="suggested-user-info">
                        <div class="suggested-user-name">${user.full_name || user.username}</div>
                        <div class="suggested-user-username">@${user.username}</div>
                    </div>
                    <button class="follow-btn ${user.is_following ? 'following' : ''}" onclick="toggleFollow(${user.id})">
                        ${user.is_following ? 'Following' : 'Follow'}
                    </button>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Failed to load suggested users:', error);
    }
}

async function toggleFollow(userId) {
    try {
        const data = await apiCall(`/api/users/${userId}/follow`, {
            method: 'POST'
        });
        
        // Update follow button
        const followBtn = event.target;
        if (data.following) {
            followBtn.textContent = 'Following';
            followBtn.classList.add('following');
        } else {
            followBtn.textContent = 'Follow';
            followBtn.classList.remove('following');
        }
        
        // Update stats if viewing own profile
        if (currentProfileUserId === currentUser.id) {
            await loadUserProfile();
        }
        
        // Reload suggested users to update follow status
        await loadSuggestedUsers();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Search functions
let searchTimeout;

async function searchUsers(query) {
    if (query.length < 2) {
        document.getElementById('search-results').classList.add('hidden');
        return;
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const users = await apiCall(`/api/users/search/${encodeURIComponent(query)}`);
            const resultsContainer = document.getElementById('search-results');
            
            if (users.length === 0) {
                resultsContainer.innerHTML = '<div class="search-result-item">No users found</div>';
            } else {
                resultsContainer.innerHTML = users.map(user => `
                    <div class="search-result-item" onclick="viewUserProfile(${user.id})">
                        <img src="${user.profile_picture || getDefaultProfilePic()}" alt="${user.username}">
                        <div>
                            <div style="font-weight: 600;">${user.full_name || user.username}</div>
                            <div style="color: #666; font-size: 0.9rem;">@${user.username}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            resultsContainer.classList.remove('hidden');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }, 300);
}

async function viewUserProfile(userId) {
    try {
        const profile = await apiCall(`/api/users/${userId}`);
        currentProfileUserId = userId;
        
        // Update modal content
        document.getElementById('modal-username').textContent = profile.full_name || profile.username;
        document.getElementById('modal-bio').textContent = profile.bio || 'No bio yet';
        document.getElementById('modal-profile-pic').src = profile.profile_picture || getDefaultProfilePic();
        document.getElementById('modal-posts-count').textContent = profile.posts_count;
        document.getElementById('modal-followers-count').textContent = profile.followers_count;
        document.getElementById('modal-following-count').textContent = profile.following_count;
        
        // Update follow button
        const followBtn = document.getElementById('follow-btn');
        if (userId === currentUser.id) {
            followBtn.style.display = 'none';
        } else {
            followBtn.style.display = 'block';
            followBtn.textContent = profile.is_following ? 'Following' : 'Follow';
            followBtn.className = `btn-primary ${profile.is_following ? 'following' : ''}`;
        }
        
        // Load initial content
        await loadUserPosts(userId);
        
        showModal('profile-modal');
        document.getElementById('search-results').classList.add('hidden');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Settings functions
async function updateProfile(profileData) {
    try {
        console.log('Updating profile with data:', profileData);
        const formData = new FormData();
        formData.append('full_name', profileData.full_name);
        formData.append('bio', profileData.bio);
        
        if (profileData.profile_picture) {
            console.log('Adding profile picture to form data:', profileData.profile_picture.name);
            formData.append('profile_picture', profileData.profile_picture);
        }
        
        // Debug: Log FormData contents
        for (let [key, value] of formData.entries()) {
            console.log('FormData entry:', key, value);
        }
        
        const response = await fetch(`${API_BASE}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Don't set Content-Type for FormData - browser will set it automatically
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update profile');
        }
        
        showToast('Profile updated successfully!', 'success');
        hideModal('settings-modal');
        loadUserProfile();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authToken && localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showApp();
        loadFeed();
        loadUserProfile();
    } else {
        showAuth();
    }
    
    hideLoading();
    
    // Auth form listeners
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });
    
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });
    
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        login({ username, password });
    });
    
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const full_name = document.getElementById('register-fullname').value;
        const password = document.getElementById('register-password').value;
        register({ username, email, full_name, password });
    });
    
    // App navigation listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('create-post-btn').addEventListener('click', () => showModal('create-post-modal'));
    document.getElementById('profile-link').addEventListener('click', () => viewUserProfile(currentUser.id));
    document.getElementById('settings-link').addEventListener('click', async () => {
        // Populate settings form with current user data
        try {
            const profile = await apiCall(`/api/users/${currentUser.id}`);
            document.getElementById('settings-fullname').value = profile.full_name || '';
            document.getElementById('settings-bio').value = profile.bio || '';
            document.getElementById('current-profile-pic').src = profile.profile_picture || getDefaultProfilePic();
        } catch (error) {
            showToast('Failed to load profile data', 'error');
        }
        showModal('settings-modal');
    });
    
    // Modal listeners
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    document.getElementById('cancel-post').addEventListener('click', () => hideModal('create-post-modal'));
    
    // Post form listener
    document.getElementById('post-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const content = document.getElementById('post-content').value.trim();
        const imageFile = document.getElementById('post-image').files[0];
        
        if (!content) return;
        
        createPost({ content, image: imageFile });
    });
    
    // Image preview
    document.getElementById('post-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('image-preview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            preview.classList.add('hidden');
        }
    });
    
    // Search listener
    document.getElementById('search-input').addEventListener('input', function(e) {
        searchUsers(e.target.value);
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-results').classList.add('hidden');
        }
    });
    
    // Load more posts
    document.getElementById('load-more-btn').addEventListener('click', function() {
        loadFeed(currentPage + 1);
    });
    
    // Profile modal tab listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            const userId = currentProfileUserId;
            
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show active content
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`profile-${tab}`).classList.add('active');
            
            // Load content based on tab
            if (tab === 'posts') {
                loadUserPosts(userId);
            } else if (tab === 'followers') {
                loadUserFollowers(userId);
            } else if (tab === 'following') {
                loadUserFollowing(userId);
            }
        });
    });
    
    // Follow button in profile modal
    document.getElementById('follow-btn').addEventListener('click', function() {
        toggleFollow(currentProfileUserId);
    });
    
    // Settings form listener
    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const full_name = document.getElementById('settings-fullname').value;
        const bio = document.getElementById('settings-bio').value;
        const profile_picture = document.getElementById('settings-profile-pic').files[0];
        
        console.log('Settings form submitted:', { full_name, bio, profile_picture });
        
        // Validate file type if a file is selected
        if (profile_picture && !profile_picture.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }
        
        updateProfile({ full_name, bio, profile_picture });
    });
    
    // Settings profile picture preview
    document.getElementById('settings-profile-pic').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('current-profile-pic');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Delete account button
    document.getElementById('delete-account-btn').addEventListener('click', async function() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including posts, comments, likes, and followers.')) {
            return;
        }
        
        if (!confirm('This is your final warning. Your account and all associated data will be permanently deleted. Are you absolutely sure?')) {
            return;
        }
        
        try {
            await apiCall('/api/users/account', {
                method: 'DELETE'
            });
            
            showToast('Account deleted successfully', 'success');
            
            // Clear local storage and redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;
            
            // Show auth screen
            showAuth();
            
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    // Sidebar navigation
    document.getElementById('home-link').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        loadFeed();
    });
    
    document.getElementById('profile-sidebar-link').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        viewUserProfile(currentUser.id);
    });
    
    // Trending topics
    document.querySelectorAll('.topic').forEach(topic => {
        topic.addEventListener('click', function() {
            showToast(`Searching for ${this.textContent}...`, 'info');
        });
    });
});

// Initialize the app
console.log('SocialConnect - Modern Social Media Platform');
console.log('Built with HTML, CSS, JavaScript, Node.js, and Express');
console.log('Features: User authentication, posts, comments, likes, follows, search, and more!');

