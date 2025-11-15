// Blog Manager for Code Blog
class AuthManager {
    constructor() {
        // Session keys for tracking logged-in user
        this.loggedInUserKey = 'loggedInUser';
        this.sessionUserKey = 'currentUser';
        
        this.init();
    }

    /**
     * Initialise authentication manager
     * Set up event listeners and check login status
     */
    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    /**
     * Set up authentication-related event listeners
     */
    setupEventListeners() {
        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Navigation link handlers for auth buttons and links
        document.querySelectorAll('#authButtons a, .alt-link a, .alt-link-a a, .alt-link-b a').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                if (page && window.blogManager) {
                    e.preventDefault();
                    window.blogManager.showPage(page);
                }
            });
        });
    }

    /**
     * Check if user is currently logged in
     * Update UI accordingly
     */
    checkLoginStatus() {
        const user = this.getCurrentUser();
        
        if (user) {
            this.updateUIForLoggedInUser(user);
        } else {
            this.updateUIForGuest();
        }
    }

    /**
     * Get currently logged-in user
     * @returns {string|null} Username or null if not logged in
     */
    getCurrentUser() {
        // Check sessionStorage first (for current session)
        let user = sessionStorage.getItem(this.sessionUserKey);
        
        // Fall back to localStorage (for persistent login)
        if (!user) {
            user = localStorage.getItem(this.loggedInUserKey);
            if (user) {
                // Restore session
                sessionStorage.setItem(this.sessionUserKey, user);
            }
        }
        
        return user;
    }

    /**
     * Set logged-in user
     * Store in both localStorage and sessionStorage
     * @param {string} username - Username to set as logged in
     */
    setLoggedInUser(username) {
        localStorage.setItem(this.loggedInUserKey, username);
        sessionStorage.setItem(this.sessionUserKey, username);
        this.updateUIForLoggedInUser(username);
    }

    /**
     * Clear logged-in user
     * Remove from both localStorage and sessionStorage
     */
    clearLoggedInUser() {
        localStorage.removeItem(this.loggedInUserKey);
        sessionStorage.removeItem(this.sessionUserKey);
        this.updateUIForGuest();
    }

    /**
     * Update UI for logged-in user
     * @param {string} username - Username of logged-in user
     */
    updateUIForLoggedInUser(username) {
        // Hide auth buttons
        const authButtons = document.getElementById('authButtons');
        if (authButtons) {
            authButtons.classList.add('hidden');
        }

        // Show user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.classList.remove('hidden');
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.textContent = username;
            }
        }

        // Show user view on home page
        const homeGuest = document.getElementById('home-guest');
        const homeUser = document.getElementById('home-user');
        if (homeGuest) homeGuest.classList.add('hidden');
        if (homeUser) homeUser.classList.remove('hidden');
    }

    /**
     * Update UI for guest (not logged in)
     */
    updateUIForGuest() {
        // Show auth buttons
        const authButtons = document.getElementById('authButtons');
        if (authButtons) {
            authButtons.classList.remove('hidden');
        }

        // Hide user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.classList.add('hidden');
        }

        // Show guest view on home page
        const homeGuest = document.getElementById('home-guest');
        const homeUser = document.getElementById('home-user');
        if (homeGuest) homeGuest.classList.remove('hidden');
        if (homeUser) homeUser.classList.add('hidden');
    }

    /**
     * Handle logout
     * TODO: Replace with AJAX call to DELETE /M00XXXXX/login
     */
    handleLogout(e) {
        e.preventDefault();
        
        // Clear stored user data
        this.clearLoggedInUser();
        
        // Redirect to home page
        if (window.blogManager) {
            window.blogManager.showPage('home');
        }
    }

    /**
     * Validate username (no spaces)
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateUsername(username) {
        return /^\S+$/.test(username);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Validate password strength (minimum 6 characters)
     * @param {string} password - Password to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validatePasswordStrength(password) {
        return password.length >= 6;
    }

    /**
     * Validate date of birth (user must be at least 10 years old)
     * @param {string} dob - Date of birth in YYYY-MM-DD format
     * @returns {boolean} True if valid, false otherwise
     */
    validateDateOfBirth(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        
        if (isNaN(birthDate.getTime()) || birthDate > today) {
            return false;
        }
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 10;
    }

    /**
     * Get all registered users from localStorage
     * TODO: This will be replaced with backend calls
     * @returns {Array} Array of user objects
     */
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    /**
     * Save users array to localStorage
     * TODO: This will be replaced with backend calls
     * @param {Array} users - Array of user objects to save
     */
    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Initialise authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});