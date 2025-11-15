// Blog Manager for Code Blog
class BlogManager {
    constructor() {
        this.currentPage = 'home';
        this.postsKey = 'posts';
        
        this.init();
    }

    /**
     * Initialise blog manager
     * Set up event listeners and load initial content
     */
    init() {
        this.setupEventListeners();
        this.showPage('home');
        
        // Check if user is logged in and load appropriate content
        const user = window.authManager ? window.authManager.getCurrentUser() : null;
        if (user) {
            this.loadRecentPosts();
        }
    }

    /**
     * Set up all blog-related event listeners
     */
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
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
     * Show specific page and hide others
     * @param {string} page - Page identifier (home, login, register, posts, create)
     */
    showPage(page) {
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
            const user = window.authManager ? window.authManager.getCurrentUser() : null;
            if (user) {
                this.loadRecentPosts();
            }
        }
    }

    /**
     * Handle create post form submission
     * NOTE: This currently uses localStorage for demo purposes
     * TODO: Replace with AJAX call to backend web service
     */
    handleCreatePost(e) {
        e.preventDefault();
        
        // Check if user is logged in
        const username = window.authManager ? window.authManager.getCurrentUser() : null;
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
        
        // Validation
        if (!title || !code || !language) {
            messageLabel.textContent = 'Please fill in all required fields.';
            messageLabel.style.color = 'red';
            return;
        }
        
        // TODO: Replace this with AJAX call to POST /M00XXXXX/contents
        // Create new post
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const newPost = {
            id: Date.now(),
            title,
            description,
            code,
            language,
            author: username,
            date: new Date().toISOString()
        };
        
        posts.unshift(newPost); // Add to beginning of array
        localStorage.setItem(this.postsKey, JSON.stringify(posts));
        
        // Show success message
        messageLabel.textContent = 'Post created successfully!';
        messageLabel.style.color = 'green';
        
        // Clear form and redirect to home page after delay
        setTimeout(() => {
            document.getElementById('createPostForm').reset();
            this.showPage('home');
        }, 1500);
    }

    /**
     * Load recent posts (first 6 posts)
     * TODO: Replace with AJAX call to GET /M00XXXXX/feed
     */
    loadRecentPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const recentPosts = posts.slice(0, 6); // Get first 6 posts
        
        this.renderPosts(recentPosts, 'recent-posts');
    }

    /**
     * Load all posts
     * TODO: Replace with AJAX call to GET /M00XXXXX/contents
     */
    loadAllPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        this.renderPosts(posts, 'all-posts');
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
                <p class="blog-author">By ${this.escapeHtml(post.author)} on ${new Date(post.date).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
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