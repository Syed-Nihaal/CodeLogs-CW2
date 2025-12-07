// Blog Manager for Code Blog
// Handles blog post creation, viewing, and navigation with AJAX calls to backend
class BlogManager {
    constructor() {
        // Base URL for API calls - REPLACE WITH YOUR STUDENT ID
        this.baseURL = '/M01039337';
        
        this.currentPage = 'home';
        
        this.init();
    }

    /**
     * Initialise blog manager and set up event listeners and load initial content
     */
    init() {
        this.setupEventListeners();
        this.showPage('home');
        
        // Check if user is logged in and load appropriate content
        this.loadInitialContent();
    }

    /**
     * Load initial content based on login status
     */
    async loadInitialContent() {
        const user = window.authManager ? await window.authManager.getCurrentUser() : null;
        if (user) {
            this.loadRecentPosts();
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation links - only handle links with .nav-link class that have data-page
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }
    }

    /**
     * Show selected page and hide other pages
     * @param {string} page - Page to show
     */
    async showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Show selected page
        const selectedPage = document.getElementById(`${page}-page`);
        if (selectedPage) {
            selectedPage.classList.remove('hidden');
        }
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active-nav');
            } else {
                link.classList.remove('active-nav');
            }
        });
        
        this.currentPage = page;
        
        // Load specific content for pages
        if (page === 'posts') {
            this.loadAllPosts();
        } else if (page === 'home') {
            // Check if user is logged in and load appropriate content
            const user = window.authManager ? await window.authManager.getCurrentUser() : null;
            if (user) {
                this.loadRecentPosts();
            }
        } else if (page === 'profile') {
            // Load logged-in user's profile
            const user = window.authManager ? await window.authManager.getCurrentUser() : null;
            if (window.profileManager) {
                window.profileManager.loadProfile(user);
            }
        }
    }

    /**
     * Handle create post form submission using AJAX
     * Sends POST request to /M01039337/contents
     * @param {Event} e - Form submit event
     */
    async handleCreatePost(e) {
        e.preventDefault();

        // Check if user is logged in
        const username = window.authManager ? await window.authManager.getCurrentUser() : null;
        if (!username) {
            const messageLabel = document.getElementById('create-messageLabel');
            messageLabel.textContent = 'Please login to create a post.';
            messageLabel.style.color = 'red';
            
            setTimeout(() => {
                this.showPage('login');
            }, 1500);
            return;
        }
        
        // Get form values
        const title = document.getElementById('post-title').value.trim();
        const description = document.getElementById('post-description').value.trim();
        const code = document.getElementById('post-code').value.trim();
        const language = document.getElementById('post-language').value.trim();
        const messageLabel = document.getElementById('create-messageLabel');
        
        // Clear previous messages
        messageLabel.textContent = '';
        
        // Validate form
        if (!title || !code || !language) {
            messageLabel.textContent = 'Please fill in all required fields.';
            messageLabel.style.color = 'red';
            return;
        }
        
        try {
            // Send POST request to /M01039337/contents
            const response = await fetch(`${this.baseURL}/contents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin', // Include session cookie
                body: JSON.stringify({
                    title: title,
                    description: description,
                    code: code,
                    language: language
                })
            });
            
            // Parse JSON response
            const data = await response.json();
            
            // Handle response
            if (data.success) {
                // Show success message
                messageLabel.textContent = 'Post created successfully!';
                messageLabel.style.color = 'green';
                
                // Clear form and redirect to home page after delay
                setTimeout(() => {
                    document.getElementById('createPostForm').reset();
                    this.showPage('home');
                }, 1500);
            } else {
                // Show error message
                messageLabel.textContent = data.message || 'Failed to create post.';
                messageLabel.style.color = 'red';
            }
            
        } catch (error) {
            // Handle network or parsing errors
            console.error('Create post error:', error);
            messageLabel.textContent = 'An error occurred while creating post.';
            messageLabel.style.color = 'red';
        }
    }

    /**
     * Load recent posts (first 6 posts) using AJAX
     * Sends GET request to /M01039337/contents
     */
    async loadRecentPosts() {
        try {
            // Send GET request to /M01039337/contents (get all, then slice)
            const response = await fetch(`${this.baseURL}/contents`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            if (data.success) {
                // Get first 6 posts
                const recentPosts = data.contents.slice(0, 6);
                this.renderPosts(recentPosts, 'recent-posts');
            } else {
                console.error('Failed to load recent posts:', data.message);
            }
            
        } catch (error) {
            console.error('Error loading recent posts:', error);
        }
    }

    /**
     * Load all posts using AJAX
     * Sends GET request to /M01039337/contents
     */
    async loadAllPosts() {
        try {
            // Send GET request to /M01039337/contents
            const response = await fetch(`${this.baseURL}/contents`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            if (data.success) {
                this.renderPosts(data.contents, 'all-posts');
            } else {
                console.error('Failed to load all posts:', data.message);
            }
            
        } catch (error) {
            console.error('Error loading all posts:', error);
        }
    }

    /**
     * Render posts to specified container
     * @param {Array} posts - Array of post objects
     * @param {string} containerId - ID of container element
     */
    renderPosts(posts, containerId) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-scores-message">No posts available yet.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="blog-card">
                <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
                ${post.description ? `<p>${this.escapeHtml(post.description)}</p>` : ''}
                <div class="blog-code">${this.escapeHtml(post.code)}</div>
                <p><strong>Language:</strong> ${this.escapeHtml(post.language)}</p>
                <p class="blog-author">By ${this.escapeHtml(post.author)} on ${new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
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

// Initialise the blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.blogManager = new BlogManager();
});