// Blog Manager for Code Blog
// Handles blog post creation, viewing, navigation, and GitHub Gists integration
class BlogManager {
    constructor() {
        // Base URL for API calls
        this.baseURL = '/M01039337';
        
        this.currentPage = 'home';
        this.currentPostsPage = 1; // Current page number for posts pagination
        this.currentLanguageFilter = ''; // Current language filter
        
        this.init();
    }

    /**
     * Initialise blog manager and set up event listeners and load initial content
     */
    init() {
        this.setupEventListeners();
        
        // Check URL on load to show correct page
        this.handleInitialRoute();
        
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            } else {
                this.showPage('home', false);
            }
        });
        
        // Check if user is logged in and load appropriate content
        this.loadInitialContent();
        
        // Set up file input display handler
        this.setupFileInputHandler();
    }
    
    /**
     * Handle initial route from URL
     */
    handleInitialRoute() {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);
        
        // If path is like /M01039337/profile, show profile page
        if (pathParts.length >= 2) {
            const page = pathParts[1];
            const validPages = ['home', 'login', 'register', 'recover', 'posts', 'create', 'profile'];
            if (validPages.includes(page)) {
                this.showPage(page, false);
                return;
            }
        }
        
        // Default to home page
        this.showPage('home', false);
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
        // Navigation links - use event delegation for reliability
        document.addEventListener('click', (e) => {
            // Handle clicks on nav-link or elements inside nav-link
            const link = e.target.closest('.nav-link[data-page]');
            if (link && !link.classList.contains('external-link')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const page = link.getAttribute('data-page');
                console.log('Navigation clicked:', page);
                this.showPage(page);
                return false;
            }
        });

        // Create post form with file upload support
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }
        
        // Language filter dropdown
        const languageFilter = document.getElementById('language-filter');
        if (languageFilter) {
            languageFilter.addEventListener('change', (e) => {
                this.currentLanguageFilter = e.target.value;
                this.currentPostsPage = 1; // Reset to first page
                this.loadAllPosts();
                // Load GitHub gists for selected language
                if (e.target.value) {
                    this.loadTrendingGists(e.target.value);
                } else {
                    this.loadTrendingGists('javascript'); // Default to JavaScript
                }
            });
        }
    }

    /**
     * Set up file input display handler
     */
    setupFileInputHandler() {
        const fileInput = document.getElementById('post-file');
        const fileName = document.getElementById('fileName');
        const fileText = document.querySelector('.file-text');
        
        if (fileInput && fileName) {
            fileInput.addEventListener('change', function(e) {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    fileName.textContent = file.name;
                    fileName.classList.add('active');
                    if (fileText) fileText.textContent = 'File selected:';
                } else {
                    fileName.textContent = '';
                    fileName.classList.remove('active');
                    if (fileText) fileText.textContent = 'Choose a file or drag here';
                }
            });
        }
    }

    /**
     * Show selected page and hide other pages
     * @param {string} page - Page to show
     * @param {boolean} pushState - Whether to push state to browser history
     */
    async showPage(page, pushState = true) {
        console.log('showPage called with:', page);
        
        // Hide all pages
        const allPages = document.querySelectorAll('.page-content');
        console.log('Found page elements:', allPages.length);
        allPages.forEach(el => {
            console.log('Hiding page:', el.id);
            el.classList.add('hidden');
        });
        
        // Show selected page
        const selectedPage = document.getElementById(`${page}-page`);
        console.log('Selected page element:', selectedPage ? selectedPage.id : 'NOT FOUND');
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
        
        // Update URL in address bar
        if (pushState) {
            const newUrl = `${this.baseURL}/${page}`;
            window.history.pushState({ page: page }, '', newUrl);
        }
        
        // Load specific content for pages
        if (page === 'posts') {
            this.currentPostsPage = 1; // Reset to first page
            this.currentLanguageFilter = ''; // Reset filter
            this.loadAllPosts();
            this.loadTrendingGists('javascript'); // Load GitHub gists
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
                await window.profileManager.loadProfile(user);
            }
        }
    }

    /**
     * Handle create post form submission using AJAX with file upload
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
        const programmingLanguage = document.getElementById('post-language').value.trim();
        const fileInput = document.getElementById('post-file');
        const messageLabel = document.getElementById('create-messageLabel');
        
        // Clear previous messages
        messageLabel.textContent = '';
        
        // Validate form
        if (!title || !code || !programmingLanguage) {
            messageLabel.textContent = 'Please fill in all required fields.';
            messageLabel.style.color = 'red';
            return;
        }
        
        // Validate file size if file is selected (max 5MB)
        if (fileInput.files.length > 0) {
            const fileSize = fileInput.files[0].size;
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            
            if (fileSize > maxSize) {
                messageLabel.textContent = 'File size must be less than 5MB.';
                messageLabel.style.color = 'red';
                return;
            }
        }
        
        try {
            // Create FormData object for file upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('code', code);
            formData.append('programmingLanguage', programmingLanguage);
            
            // Add file if selected
            if (fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }
            
            // Show uploading message
            messageLabel.textContent = 'Uploading post...';
            messageLabel.style.color = 'blue';
            
            // Send POST request to /M01039337/contents with FormData
            const response = await fetch(`${this.baseURL}/contents`, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData // Don't set Content-Type header - browser will set it automatically with boundary
            });
            
            // Parse JSON response
            const data = await response.json();
            
            // Handle response
            if (data.success) {
                // Show success message with file upload status
                let successMsg = 'Post created successfully!';
                if (data.fileUploaded) {
                    successMsg += ' File attached.';
                }
                messageLabel.textContent = successMsg;
                messageLabel.style.color = 'green';
                
                // Clear form and redirect to home page after delay
                setTimeout(() => {
                    document.getElementById('createPostForm').reset();
                    // Reset file display
                    const fileName = document.getElementById('fileName');
                    const fileText = document.querySelector('.file-text');
                    if (fileName) {
                        fileName.textContent = '';
                        fileName.classList.remove('active');
                    }
                    if (fileText) {
                        fileText.textContent = 'Choose a file or drag here';
                    }
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
     * Load recent posts (first 10 posts) using AJAX with pagination
     * Sends GET request to /M01039337/contents
     */
    async loadRecentPosts() {
        try {
            // Send GET request to /M01039337/contents with pagination (limit 10 for recent)
            const response = await fetch(`${this.baseURL}/contents?page=1&limit=10`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            if (data.success) {
                this.renderPosts(data.contents, 'recent-posts', false); // false = no pagination controls
            } else {
                console.error('Failed to load recent posts:', data.message);
            }
            
        } catch (error) {
            console.error('Error loading recent posts:', error);
        }
    }

    /**
     * Load all posts using AJAX with pagination and language filter
     * Sends GET request to /M01039337/contents
     */
    async loadAllPosts() {
        try {
            // Build query parameters
            let queryParams = `q=`;
            
            // Add language filter if selected
            if (this.currentLanguageFilter) {
                queryParams += encodeURIComponent(this.currentLanguageFilter);
            }
            
            // Send GET request to /M01039337/contents with search query
            const response = await fetch(`${this.baseURL}/contents?${queryParams}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            // Parse JSON response
            const data = await response.json();
            
            if (data.success) {
                this.renderPosts(data.contents, 'all-posts', false);
            } else {
                console.error('Failed to load all posts:', data.message);
            }
            
        } catch (error) {
            console.error('Error loading all posts:', error);
        }
    }

    /**
     * Load trending gists from GitHub filtered by programming language (THIRD-PARTY DATA)
     * @param {string} language - Programming language to filter by
     */
    async loadTrendingGists(language = 'javascript') {
        try {
            // Send GET request to server endpoint that fetches from GitHub
            const response = await fetch(`${this.baseURL}/trending-gists?language=${encodeURIComponent(language)}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.gists && data.gists.length > 0) {
                this.renderTrendingGists(data.gists, language);
            } else {
                this.renderNoGists(language);
            }
            
        } catch (error) {
            console.error('Error loading trending gists:', error);
            this.renderGistsError();
        }
    }

    /**
     * Render trending gists in the sidebar container
     * @param {Array} gists - Array of gist objects from GitHub
     * @param {string} language - Programming language filter
     */
    renderTrendingGists(gists, language) {
        const container = document.getElementById('trending-gists-container');
        if (!container) return;
        
        const html = `
            <div class="trending-gists-section">
                <h3>🔥 Trending ${language.charAt(0).toUpperCase() + language.slice(1)} Code on GitHub</h3>
                <div class="gists-list">
                    ${gists.map(gist => `
                        <div class="gist-card">
                            <div class="gist-header">
                                <img src="${gist.authorAvatar}" alt="${this.escapeHtml(gist.author)}" class="gist-avatar">
                                <div class="gist-author-info">
                                    <a href="${gist.authorUrl}" target="_blank" rel="noopener noreferrer" class="gist-author-name">
                                        ${this.escapeHtml(gist.author)}
                                    </a>
                                    <span class="gist-date">${this.formatDate(gist.createdAt)}</span>
                                </div>
                            </div>
                            <a href="${gist.url}" target="_blank" rel="noopener noreferrer" class="gist-link">
                                <h4 class="gist-description">${this.escapeHtml(gist.description)}</h4>
                            </a>
                            <div class="gist-meta">
                                <span class="gist-file-count">📄 ${gist.fileCount} file${gist.fileCount > 1 ? 's' : ''}</span>
                                <span class="gist-files">${gist.files.slice(0, 2).join(', ')}${gist.files.length > 2 ? '...' : ''}</span>
                            </div>
                            <a href="${gist.url}" target="_blank" rel="noopener noreferrer" class="gist-view-btn">
                                View on GitHub →
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Render message when no gists are found
     * @param {string} language - Programming language filter
     */
    renderNoGists(language) {
        const container = document.getElementById('trending-gists-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="trending-gists-section">
                <h3>🔥 Trending ${language.charAt(0).toUpperCase() + language.slice(1)} Code on GitHub</h3>
                <p class="no-gists-message">No trending ${language} gists found at the moment.</p>
            </div>
        `;
    }

    /**
     * Render error message when gists fail to load
     */
    renderGistsError() {
        const container = document.getElementById('trending-gists-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="trending-gists-section">
                <h3>🔥 Trending Code on GitHub</h3>
                <p class="gists-error-message">Unable to load trending gists. Please try again later.</p>
            </div>
        `;
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    }

    /**
     * Render posts to specified container with optional pagination
     * @param {Array} posts - Array of post objects
     * @param {string} containerId - ID of container element
     * @param {boolean} showPagination - Whether to show pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     */
    renderPosts(posts, containerId, showPagination = false, currentPage = 1, totalPages = 1) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-results-message">No posts available yet.</p>';
            return;
        }
        
        // Render posts
        let html = posts.map(post => `
            <div class="blog-card">
                <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
                ${post.description ? `<p>${this.escapeHtml(post.description)}</p>` : ''}
                <div class="blog-code">${this.escapeHtml(post.code)}</div>
                <p><strong>Language:</strong> ${this.escapeHtml(post.programmingLanguage || post.language || '')}</p>
                ${post.fileUrl ? `<p><strong>Attachment:</strong> <a href="${post.fileUrl}" target="_blank" class="file-link" download>📎 ${post.fileName || 'Download File'}</a></p>` : ''}
                <p class="blog-author">By ${this.escapeHtml(post.author)} on ${new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
        
        // Add pagination controls if needed
        if (showPagination && totalPages > 1) {
            html += this.renderPaginationControls(currentPage, totalPages);
        }
        
        container.innerHTML = html;
        
        // Add event listeners to pagination buttons
        if (showPagination && totalPages > 1) {
            this.setupPaginationListeners();
        }
    }

    /**
     * Render pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     * @returns {string} HTML for pagination controls
     */
    renderPaginationControls(currentPage, totalPages) {
        let html = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button class="pagination-btn" data-page="${currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${currentPage + 1}">Next</button>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Set up event listeners for pagination buttons
     */
    setupPaginationListeners() {
        document.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPostsPage = parseInt(e.target.getAttribute('data-page'));
                this.loadAllPosts();
                // Scroll to top of posts
                document.getElementById('all-posts').scrollIntoView({ behavior: 'smooth' });
            });
        });
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