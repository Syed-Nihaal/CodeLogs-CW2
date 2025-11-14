// Blog Manager for Code Blog
class BlogManager {
    constructor() {
        this.currentPage = 'home';
        this.postsKey = 'posts';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showPage('home');
        this.loadRecentPosts();
    }

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Auth buttons
        document.querySelectorAll('#authButtons a').forEach(button => {
            button.addEventListener('click', (e) => {
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

    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Show selected page
        document.getElementById(`${page}-page`).classList.remove('hidden');
        
        // Update navigation
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
        }
    }

    handleCreatePost(e) {
        e.preventDefault();
        
        // Check if user is logged in
        const username = window.authManager.getCurrentUser();
        if (!username) {
            alert('Please login to create a post.');
            this.showPage('login');
            return;
        }
        
        const title = document.getElementById('post-title').value.trim();
        const description = document.getElementById('post-description').value.trim();
        const code = document.getElementById('post-code').value.trim();
        const language = document.getElementById('post-language').value.trim();
        const messageLabel = document.getElementById('create-messageLabel');
        
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
        
        messageLabel.textContent = 'Post created successfully!';
        messageLabel.style.color = 'green';
        
        // Clear form and redirect to posts page after a delay
        setTimeout(() => {
            document.getElementById('createPostForm').reset();
            this.showPage('posts');
        }, 1500);
    }

    loadRecentPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        const recentPosts = posts.slice(0, 3); // Get first 3 posts
        
        this.renderPosts(recentPosts, 'recent-posts');
    }

    loadAllPosts() {
        const posts = JSON.parse(localStorage.getItem(this.postsKey)) || [];
        this.renderPosts(posts, 'all-posts');
    }

    renderPosts(posts, containerId) {
        const container = document.getElementById(containerId);
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-scores-message">No posts available yet.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="blog-card">
                <h3 class="blog-title">${post.title}</h3>
                ${post.description ? `<p>${post.description}</p>` : ''}
                <div class="blog-code">${this.escapeHtml(post.code)}</div>
                <p><strong>Language:</strong> ${post.language}</p>
                <p class="blog-author">By ${post.author} on ${new Date(post.date).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.blogManager = new BlogManager();
});