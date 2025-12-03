// Blog Manager for Code Blog
class BlogManager {
    constructor() {
        this.currentPage = 'home';
        this.postsKey = 'posts';
        
        this.init();
    }

    //Initialise blog manager and set up event listeners and load initial content
    init() {
        this.setupEventListeners();
        this.showPage('home');
        
        // Check if user is logged in and load appropriate content
        const user = window.authManager ? window.authManager.getCurrentUser() : null;
        if (user) {
            this.loadRecentPosts();
        }
    }

    // Setting up event listeners
    setupEventListeners() {
        // Navigation links - only handle links with .nav-link class that have data-page
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Creating post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }
    }

    // Showing selected page and hiding other pages
    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Showing selected page
        const selectedPage = document.getElementById(`${page}-page`);
        if (selectedPage) {
            selectedPage.classList.remove('hidden');
        }
        
        // Updating navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active-nav');
            } else {
                link.classList.remove('active-nav');
            }
        });
        
        this.currentPage = page;
        
        // Loading specific content for pages
        if (page === 'posts') {
            this.loadAllPosts();
        } else if (page === 'home') {
            // Checking if user is logged in and load appropriate content
            const user = window.authManager ? window.authManager.getCurrentUser() : null;
            if (user) {
                this.loadRecentPosts();
            }
        }

        if (page === 'profile') {
            // Load logged-in user's profile
            const user = window.authManager ? window.authManager.getCurrentUser() : null;
            if (window.profileManager) {
                window.profileManager.loadProfile(user);
            }
        }
    }

    // Handling create a post form submission
    handleCreatePost(e) {
        e.preventDefault();

        // Checking if user is logged in
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
        
        // Getting form values
        const title = document.getElementById('post-title').value.trim();
        const description = document.getElementById('post-description').value.trim();
        const code = document.getElementById('post-code').value.trim();
        const language = document.getElementById('post-language').value.trim();
        const messageLabel = document.getElementById('create-messageLabel');
        
        // Clearing previous messages
        messageLabel.textContent = '';
        
        // Validating form
        if (!title || !code || !language) {
            messageLabel.textContent = 'Please fill in all required fields.';
            messageLabel.style.color = 'red';
            return;
        }
        
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

    // Load recent posts (first 6 posts)
    loadRecentPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const recentPosts = posts.slice(0, 6); // Get first 6 posts
        
        this.renderPosts(recentPosts, 'recent-posts');
    }

    // Load all posts
    loadAllPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        this.renderPosts(posts, 'all-posts');
    }

    // Render posts to specified container
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
}

// Initialise the blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.blogManager = new BlogManager();
});