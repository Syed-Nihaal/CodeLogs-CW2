/**
 * Search Manager for user search functionality
 * Handles real-time user search with autocomplete dropdown
 */
class SearchManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        // DOM elements
        this.searchInput = null;
        this.searchResults = null;
        this.searchToggle = null;
        this.searchTimeout = null;
        
        this.init();
    }

    /**
     * Initialize search manager
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
    }

    /**
     * Setup DOM element references
     */
    setupElements() {
        this.searchInput = document.getElementById('userSearchInput');
        this.searchResults = document.getElementById('searchResults');
        this.searchToggle = document.getElementById('searchToggle');
    }

    /**
     * Setup event listeners for search functionality
     */
    setupEventListeners() {
        if (!this.searchInput || !this.searchToggle) return;
        
        // Toggle button to show/hide search input
        this.searchToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSearchInput();
        });
        
        // Search input event - debounced
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                this.hideSearchResults();
                return;
            }
            
            // Debounce search requests
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });
    }

    /**
     * Toggle search input visibility
     */
    toggleSearchInput() {
        if (this.searchInput.classList.contains('hidden')) {
            // Show search input
            this.searchInput.classList.remove('hidden');
            this.searchInput.focus();
        } else {
            // Hide search input
            this.searchInput.classList.add('hidden');
            this.searchInput.value = '';
            this.hideSearchResults();
        }
    }

    /**
     * Perform user search via API
     * @param {string} query - Search query string
     */
    async performSearch(query) {
        try {
            const response = await fetch(`${this.baseURL}/users?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.users && data.users.length > 0) {
                this.displaySearchResults(data.users);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError();
        }
    }

    /**
     * Display search results in dropdown
     * @param {Array} users - Array of user objects
     */
    displaySearchResults(users) {
        if (!this.searchResults) return;
        
        const html = users.map(user => `
            <div class="search-result-item" data-username="${this.escapeHtml(user.username)}">
                <div class="search-result-username">${this.escapeHtml(user.username)}</div>
                <div class="search-result-email">${this.escapeHtml(user.email)}</div>
            </div>
        `).join('');
        
        this.searchResults.innerHTML = html;
        this.searchResults.classList.remove('hidden');
        
        // Add click listeners to results
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const username = item.getAttribute('data-username');
                this.selectResult(username);
            });
        });
    }

    /**
     * Show "no results" message
     */
    showNoResults() {
        if (!this.searchResults) return;
        this.searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: rgba(255, 255, 255, 0.6);">No users found</div>';
        this.searchResults.classList.remove('hidden');
    }

    /**
     * Show search error message
     */
    showSearchError() {
        if (!this.searchResults) return;
        this.searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: rgba(255, 100, 100, 0.8);">Search error</div>';
        this.searchResults.classList.remove('hidden');
    }

    /**
     * Hide search results dropdown
     */
    hideSearchResults() {
        if (this.searchResults) {
            this.searchResults.classList.add('hidden');
        }
    }

    /**
     * Handle result selection - navigate to user profile
     * @param {string} username - Selected username
     */
    selectResult(username) {
        // Load user profile
        if (window.profileManager) {
            window.profileManager.loadProfile(username);
        }
        
        // Clear search and hide results
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.hideSearchResults();
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

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.searchManager = new SearchManager();
});
