/**
 * Profile Manager class to handle user profile functionality
 * Manages profile display, stats, posts, followers, and following
 */
class ProfileManager {
    constructor() {
        // Keys for localStorage
        this.postsKey = 'posts';
        this.followersKey = 'followers'; // Format: {username: [follower1, follower2, ...]}
        this.followingKey = 'following'; // Format: {username: [following1, following2, ...]}
        this.likesKey = 'likes'; // Format: {postId: [user1, user2, ...]}
        
        // Current viewing user (can be different from logged-in user)
        this.currentProfileUser = null;
        
        this.init();
    }

    /**
     * Initialise profile manager and set up event listeners
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Set up profile-related event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Follow button
        const followButton = document.getElementById('followButton');
        if (followButton) {
            followButton.addEventListener('click', () => this.handleFollowToggle());
        }

        // User card clicks (to view other profiles)
        document.addEventListener('click', (e) => {
            const userCard = e.target.closest('.user-card');
            if (userCard && userCard.dataset.username) {
                this.loadProfile(userCard.dataset.username);
            }
        });
    }

    /**
     * Handle tab switching between Posts, Following, and Followers
     * @param {Event} e - Click event from tab button
     */
    handleTabSwitch(e) {
        const targetTab = e.target.dataset.tab;
        
        // Update button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${targetTab}Tab`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }
        
        // Load appropriate content
        switch(targetTab) {
            case 'posts':
                this.loadUserPosts();
                break;
            case 'following':
                this.loadFollowing();
                break;
            case 'followers':
                this.loadFollowers();
                break;
        }
    }

    /**
     * Load profile for specified user
     * @param {string} username - Username of profile to load
     */
    loadProfile(username) {
        // Get logged-in user
        const loggedInUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        // If no username specified, load logged-in user's profile
        if (!username) {
            username = loggedInUser;
        }
        
        // If still no username, redirect to login
        if (!username) {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
            return;
        }
        
        this.currentProfileUser = username;
        
        // Get user data
        const users = window.authManager ? window.authManager.getUsers() : [];
        const user = users.find(u => u.username === username);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Update profile header
        this.updateProfileHeader(user);
        
        // Update stats
        this.updateProfileStats(username);
        
        // Show/hide follow button
        this.updateFollowButton(username, loggedInUser);
        
        // Load posts by default
        this.loadUserPosts();
        
        // Show profile page
        if (window.blogManager) {
            window.blogManager.showPage('profile');
        }
    }

    /**
     * Update profile header with user information
     * @param {Object} user - User object containing username and email
     */
    updateProfileHeader(user) {
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        
        if (usernameEl) usernameEl.textContent = user.username;
        if (emailEl) emailEl.textContent = user.email;
    }

    /**
     * Update profile statistics (posts, likes, followers, following)
     * @param {string} username - Username to get stats for
     */
    updateProfileStats(username) {
        // Get posts count
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const userPosts = posts.filter(post => post.author === username);
        const postsCount = userPosts.length;
        
        // Get likes count (total likes on all user's posts)
        const likes = JSON.parse(localStorage.getItem(this.likesKey)) || {};
        let likesCount = 0;
        userPosts.forEach(post => {
            if (likes[post.id]) {
                likesCount += likes[post.id].length;
            }
        });
        
        // Get followers count
        const followersData = JSON.parse(localStorage.getItem(this.followersKey)) || {};
        const followers = followersData[username] || [];
        const followersCount = followers.length;
        
        // Get following count
        const followingData = JSON.parse(localStorage.getItem(this.followingKey)) || {};
        const following = followingData[username] || [];
        const followingCount = following.length;
        
        // Update UI
        const statPosts = document.getElementById('statPosts');
        const statLikes = document.getElementById('statLikes');
        const statFollowers = document.getElementById('statFollowers');
        const statFollowing = document.getElementById('statFollowing');
        
        if (statPosts) statPosts.textContent = postsCount;
        if (statLikes) statLikes.textContent = likesCount;
        if (statFollowers) statFollowers.textContent = followersCount;
        if (statFollowing) statFollowing.textContent = followingCount;
    }

    /**
     * Update follow button visibility and state
     * @param {string} profileUsername - Username of profile being viewed
     * @param {string} loggedInUser - Username of logged-in user
     */
    updateFollowButton(profileUsername, loggedInUser) {
        const followButton = document.getElementById('followButton');
        
        if (!followButton) return;
        
        // Hide button if viewing own profile or not logged in
        if (!loggedInUser || profileUsername === loggedInUser) {
            followButton.classList.add('hidden');
            return;
        }
        
        // Show button and update state
        followButton.classList.remove('hidden');
        
        // Check if already following
        const isFollowing = this.isFollowing(loggedInUser, profileUsername);
        
        if (isFollowing) {
            followButton.textContent = 'Unfollow';
            followButton.classList.add('following');
        } else {
            followButton.textContent = 'Follow';
            followButton.classList.remove('following');
        }
    }

    /**
     * Check if user is following another user
     * @param {string} follower - Username of potential follower
     * @param {string} following - Username of user being followed
     * @returns {boolean} True if following, false otherwise
     */
    isFollowing(follower, following) {
        const followingData = JSON.parse(localStorage.getItem(this.followingKey)) || {};
        const userFollowing = followingData[follower] || [];
        return userFollowing.includes(following);
    }

    /**
     * Handle follow/unfollow button click
     * TODO: Replace with AJAX calls to POST/DELETE /M00XXXXX/follow
     */
    handleFollowToggle() {
        const loggedInUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        if (!loggedInUser) {
            alert('Please log in to follow users');
            return;
        }
        
        const isFollowing = this.isFollowing(loggedInUser, this.currentProfileUser);
        
        if (isFollowing) {
            this.unfollowUser(loggedInUser, this.currentProfileUser);
        } else {
            this.followUser(loggedInUser, this.currentProfileUser);
        }
    }

    /**
     * Follow a user
     * @param {string} follower - Username of follower
     * @param {string} following - Username to follow
     */
    followUser(follower, following) {
        // Update following list
        const followingData = JSON.parse(localStorage.getItem(this.followingKey)) || {};
        if (!followingData[follower]) {
            followingData[follower] = [];
        }
        if (!followingData[follower].includes(following)) {
            followingData[follower].push(following);
        }
        localStorage.setItem(this.followingKey, JSON.stringify(followingData));
        
        // Update followers list
        const followersData = JSON.parse(localStorage.getItem(this.followersKey)) || {};
        if (!followersData[following]) {
            followersData[following] = [];
        }
        if (!followersData[following].includes(follower)) {
            followersData[following].push(follower);
        }
        localStorage.setItem(this.followersKey, JSON.stringify(followersData));
        
        // Update UI
        this.updateProfileStats(this.currentProfileUser);
        this.updateFollowButton(this.currentProfileUser, follower);
    }

    /**
     * Unfollow a user
     * @param {string} follower - Username of follower
     * @param {string} following - Username to unfollow
     */
    unfollowUser(follower, following) {
        // Update following list
        const followingData = JSON.parse(localStorage.getItem(this.followingKey)) || {};
        if (followingData[follower]) {
            followingData[follower] = followingData[follower].filter(u => u !== following);
        }
        localStorage.setItem(this.followingKey, JSON.stringify(followingData));
        
        // Update followers list
        const followersData = JSON.parse(localStorage.getItem(this.followersKey)) || {};
        if (followersData[following]) {
            followersData[following] = followersData[following].filter(u => u !== follower);
        }
        localStorage.setItem(this.followersKey, JSON.stringify(followersData));
        
        // Update UI
        this.updateProfileStats(this.currentProfileUser);
        this.updateFollowButton(this.currentProfileUser, follower);
    }

    /**
     * Load posts created by current profile user
     */
    loadUserPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const userPosts = posts.filter(post => post.author === this.currentProfileUser);
        
        const container = document.getElementById('profile-posts');
        
        if (!container) return;
        
        if (userPosts.length === 0) {
            container.innerHTML = '<p class="no-results-message">No posts yet.</p>';
            return;
        }
        
        container.innerHTML = userPosts.map(post => `
            <div class="blog-card">
                <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
                ${post.description ? `<p>${this.escapeHtml(post.description)}</p>` : ''}
                <div class="blog-code">${this.escapeHtml(post.code)}</div>
                <p><strong>Language:</strong> ${this.escapeHtml(post.language)}</p>
                <p class="blog-author">Posted on ${new Date(post.date).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    /**
     * Load list of users that current profile user is following
     */
    loadFollowing() {
        const followingData = JSON.parse(localStorage.getItem(this.followingKey)) || {};
        const following = followingData[this.currentProfileUser] || [];
        
        const container = document.getElementById('following-list');
        
        if (!container) return;
        
        if (following.length === 0) {
            container.innerHTML = '<p class="no-results-message">Not following anyone yet.</p>';
            return;
        }
        
        // Get user details
        const users = window.authManager ? window.authManager.getUsers() : [];
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        
        container.innerHTML = following.map(username => {
            const user = users.find(u => u.username === username);
            if (!user) return '';
            
            const userPosts = posts.filter(p => p.author === username);
            const followersData = JSON.parse(localStorage.getItem(this.followersKey)) || {};
            const followers = followersData[username] || [];
            
            return `
                <div class="user-card" data-username="${username}">
                    <div class="user-card-header">
                        <img src="assets/img/default-avatar.png" alt="${username}" class="user-card-avatar">
                        <div class="user-card-info">
                            <h3>${this.escapeHtml(username)}</h3>
                            <p>${this.escapeHtml(user.email)}</p>
                        </div>
                    </div>
                    <div class="user-card-stats">
                        <div class="user-card-stat">
                            <span>${userPosts.length}</span>
                            <small>Posts</small>
                        </div>
                        <div class="user-card-stat">
                            <span>${followers.length}</span>
                            <small>Followers</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Load list of users following current profile user
     */
    loadFollowers() {
        const followersData = JSON.parse(localStorage.getItem(this.followersKey)) || {};
        const followers = followersData[this.currentProfileUser] || [];
        
        const container = document.getElementById('followers-list');
        
        if (!container) return;
        
        if (followers.length === 0) {
            container.innerHTML = '<p class="no-results-message">No followers yet.</p>';
            return;
        }
        
        // Get user details
        const users = window.authManager ? window.authManager.getUsers() : [];
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        
        container.innerHTML = followers.map(username => {
            const user = users.find(u => u.username === username);
            if (!user) return '';
            
            const userPosts = posts.filter(p => p.author === username);
            const userFollowers = followersData[username] || [];
            
            return `
                <div class="user-card" data-username="${username}">
                    <div class="user-card-header">
                        <img src="assets/img/default-avatar.png" alt="${username}" class="user-card-avatar">
                        <div class="user-card-info">
                            <h3>${this.escapeHtml(username)}</h3>
                            <p>${this.escapeHtml(user.email)}</p>
                        </div>
                    </div>
                    <div class="user-card-stats">
                        <div class="user-card-stat">
                            <span>${userPosts.length}</span>
                            <small>Posts</small>
                        </div>
                        <div class="user-card-stat">
                            <span>${userFollowers.length}</span>
                            <small>Followers</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialise profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});