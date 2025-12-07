/**
 * Profile Manager class to handle user profile functionality with AJAX
 * Manages profile display, stats, posts, followers, and following
 */
class ProfileManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
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
     * Load profile for specified user using AJAX
     * Sends GET request to /M01039337/users/:username/profile
     * @param {string} username - Username of profile to load
     */
    async loadProfile(username) {
        // Get logged-in user
        const loggedInUser = window.authManager ? await window.authManager.getCurrentUser() : null;
        
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
        
        try {
            // Send GET request to /M01039337/users/:username/profile
            const response = await fetch(`${this.baseURL}/users/${username}/profile`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            if (data.success) {
                // Update profile header
                this.updateProfileHeader(data.profile);
                
                // Update stats
                this.updateProfileStats(data.profile.stats);
                
                // Show/hide follow button
                this.updateFollowButton(username, loggedInUser, data.profile.isFollowing);
                
                // Load posts by default
                this.loadUserPosts();
                
                // Show profile page
                if (window.blogManager) {
                    window.blogManager.showPage('profile');
                }
            } else {
                alert(data.message || 'User not found');
            }
            
        } catch (error) {
            console.error('Profile error:', error);
            alert('An error occurred while loading profile.');
        }
    }

    /**
     * Update profile header with user information
     * @param {Object} profile - Profile object containing username and email
     */
    updateProfileHeader(profile) {
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        
        if (usernameEl) usernameEl.textContent = profile.username;
        if (emailEl) emailEl.textContent = profile.email;
    }

    /**
     * Update profile statistics (posts, likes, followers, following)
     * @param {Object} stats - Stats object containing counts
     */
    updateProfileStats(stats) {
        const statPosts = document.getElementById('statPosts');
        const statLikes = document.getElementById('statLikes');
        const statFollowers = document.getElementById('statFollowers');
        const statFollowing = document.getElementById('statFollowing');
        
        if (statPosts) statPosts.textContent = stats.posts || 0;
        if (statLikes) statLikes.textContent = stats.likes || 0;
        if (statFollowers) statFollowers.textContent = stats.followers || 0;
        if (statFollowing) statFollowing.textContent = stats.following || 0;
    }

    /**
     * Update follow button visibility and state
     * @param {string} profileUsername - Username of profile being viewed
     * @param {string} loggedInUser - Username of logged-in user
     * @param {boolean} isFollowing - Whether user is already following
     */
    updateFollowButton(profileUsername, loggedInUser, isFollowing) {
        const followButton = document.getElementById('followButton');
        
        if (!followButton) return;
        
        // Hide button if viewing own profile or not logged in
        if (!loggedInUser || profileUsername === loggedInUser) {
            followButton.classList.add('hidden');
            return;
        }
        
        // Show button and update state
        followButton.classList.remove('hidden');
        
        if (isFollowing) {
            followButton.textContent = 'Unfollow';
            followButton.classList.add('following');
        } else {
            followButton.textContent = 'Follow';
            followButton.classList.remove('following');
        }
    }

    /**
     * Handle follow/unfollow button click using AJAX
     * Sends POST or DELETE request to /M01039337/follow
     */
    async handleFollowToggle() {
        const loggedInUser = window.authManager ? await window.authManager.getCurrentUser() : null;
        
        if (!loggedInUser) {
            alert('Please log in to follow users');
            return;
        }
        
        const followButton = document.getElementById('followButton');
        const isFollowing = followButton.classList.contains('following');
        
        try {
            if (isFollowing) {
                // Unfollow - send DELETE request
                await this.unfollowUser(this.currentProfileUser);
            } else {
                // Follow - send POST request
                await this.followUser(this.currentProfileUser);
            }
            
            // Reload profile to update stats and button state
            this.loadProfile(this.currentProfileUser);
            
        } catch (error) {
            console.error('Follow toggle error:', error);
            alert('An error occurred. Please try again.');
        }
    }

    /**
     * Follow a user using AJAX
     * Sends POST request to /M01039337/follow
     * @param {string} username - Username to follow
     */
    async followUser(username) {
        try {
            const response = await fetch(`${this.baseURL}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: username
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                alert(data.message || 'Failed to follow user.');
            }
            
        } catch (error) {
            console.error('Follow error:', error);
            throw error;
        }
    }

    /**
     * Unfollow a user using AJAX
     * Sends DELETE request to /M01039337/follow
     * @param {string} username - Username to unfollow
     */
    async unfollowUser(username) {
        try {
            const response = await fetch(`${this.baseURL}/follow`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: username
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                alert(data.message || 'Failed to unfollow user.');
            }
            
        } catch (error) {
            console.error('Unfollow error:', error);
            throw error;
        }
    }

    /**
     * Load posts created by current profile user using AJAX
     * Sends GET request to /M01039337/users/:username/posts
     */
    async loadUserPosts() {
        const container = document.getElementById('profile-posts');
        
        if (!container) return;
        
        try {
            const response = await fetch(`${this.baseURL}/users/${this.currentProfileUser}/posts`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.posts.length === 0) {
                    container.innerHTML = '<p class="no-results-message">No posts yet.</p>';
                    return;
                }
                
                container.innerHTML = data.posts.map(post => `
                    <div class="blog-card">
                        <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
                        ${post.description ? `<p>${this.escapeHtml(post.description)}</p>` : ''}
                        <div class="blog-code">${this.escapeHtml(post.code)}</div>
                        <p><strong>Language:</strong> ${this.escapeHtml(post.language)}</p>
                        <p class="blog-author">Posted on ${new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="no-results-message">Failed to load posts.</p>';
            }
            
        } catch (error) {
            console.error('Load posts error:', error);
            container.innerHTML = '<p class="no-results-message">Error loading posts.</p>';
        }
    }

    /**
     * Load list of users that current profile user is following using AJAX
     * Sends GET request to /M01039337/users/:username/following
     */
    async loadFollowing() {
        const container = document.getElementById('following-list');
        
        if (!container) return;
        
        try {
            const response = await fetch(`${this.baseURL}/users/${this.currentProfileUser}/following`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.following.length === 0) {
                    container.innerHTML = '<p class="no-results-message">Not following anyone yet.</p>';
                    return;
                }
                
                // Get stats for each user
                container.innerHTML = await Promise.all(data.following.map(async user => {
                    try {
                        const statsResponse = await fetch(`${this.baseURL}/users/${user.username}/stats`, {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        const statsData = await statsResponse.json();
                        const stats = statsData.success ? statsData.stats : { posts: 0, followers: 0 };
                        
                        return `
                            <div class="user-card" data-username="${user.username}">
                                <div class="user-card-header">
                                    <img src="assets/img/default-avatar.png" alt="${user.username}" class="user-card-avatar">
                                    <div class="user-card-info">
                                        <h3>${this.escapeHtml(user.username)}</h3>
                                        <p>${this.escapeHtml(user.email)}</p>
                                    </div>
                                </div>
                                <div class="user-card-stats">
                                    <div class="user-card-stat">
                                        <span>${stats.posts}</span>
                                        <small>Posts</small>
                                    </div>
                                    <div class="user-card-stat">
                                        <span>${stats.followers}</span>
                                        <small>Followers</small>
                                    </div>
                                </div>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error loading stats for', user.username, error);
                        return '';
                    }
                })).then(cards => cards.join(''));
            } else {
                container.innerHTML = '<p class="no-results-message">Failed to load following list.</p>';
            }
            
        } catch (error) {
            console.error('Load following error:', error);
            container.innerHTML = '<p class="no-results-message">Error loading following list.</p>';
        }
    }

    /**
     * Load list of users following current profile user using AJAX
     * Sends GET request to /M01039337/users/:username/followers
     */
    async loadFollowers() {
        const container = document.getElementById('followers-list');
        
        if (!container) return;
        
        try {
            const response = await fetch(`${this.baseURL}/users/${this.currentProfileUser}/followers`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.followers.length === 0) {
                    container.innerHTML = '<p class="no-results-message">No followers yet.</p>';
                    return;
                }
                
                // Get stats for each user
                container.innerHTML = await Promise.all(data.followers.map(async user => {
                    try {
                        const statsResponse = await fetch(`${this.baseURL}/users/${user.username}/stats`, {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        const statsData = await statsResponse.json();
                        const stats = statsData.success ? statsData.stats : { posts: 0, followers: 0 };
                        
                        return `
                            <div class="user-card" data-username="${user.username}">
                                <div class="user-card-header">
                                    <img src="assets/img/default-avatar.png" alt="${user.username}" class="user-card-avatar">
                                    <div class="user-card-info">
                                        <h3>${this.escapeHtml(user.username)}</h3>
                                        <p>${this.escapeHtml(user.email)}</p>
                                    </div>
                                </div>
                                <div class="user-card-stats">
                                    <div class="user-card-stat">
                                        <span>${stats.posts}</span>
                                        <small>Posts</small>
                                    </div>
                                    <div class="user-card-stat">
                                        <span>${stats.followers}</span>
                                        <small>Followers</small>
                                    </div>
                                </div>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error loading stats for', user.username, error);
                        return '';
                    }
                })).then(cards => cards.join(''));
            } else {
                container.innerHTML = '<p class="no-results-message">Failed to load followers list.</p>';
            }
            
        } catch (error) {
            console.error('Load followers error:', error);
            container.innerHTML = '<p class="no-results-message">Error loading followers list.</p>';
        }
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