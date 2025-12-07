// Authentication Manager for Code Blog
// Handles user authentication, login status checks, and logout functionality
class AuthManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        // Session keys for tracking logged-in user (fallback only)
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

        // Use event delegation on document body for all navigation links
        // This handles links that may be hidden/shown dynamically
        document.body.addEventListener('click', (e) => {
            // Check if clicked element or its parent has data-page attribute
            const target = e.target.closest('[data-page]');
            if (target) {
                const page = target.getAttribute('data-page');
                if (page && window.blogManager) {
                    e.preventDefault();
                    window.blogManager.showPage(page);
                }
            }
            
            // Don't prevent default for external links (those without data-page)
            // This allows links like GitHub to work normally
        });
    }

    /**
     * Check if user is currently logged in by calling the server
     * Update UI accordingly
     */
    async checkLoginStatus() {
        try {
            // Call GET /M01039337/login to check login status
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'GET',
                credentials: 'same-origin' // Include session cookie
            });
            
            const data = await response.json();
            
            // Update UI based on login status
            if (data.success && data.loggedIn && data.username) {
                this.updateUIForLoggedInUser(data.username);
            } else {
                this.updateUIForGuest();
            }
            
        } catch (error) {
            console.error('Error checking login status:', error);
            // Fall back to guest view if error occurs
            this.updateUIForGuest();
        }
    }

    /**
     * Get currently logged-in user from server
     * @returns {Promise<string|null>} Username or null if not logged in
     */
    async getCurrentUser() {
        try {
            // Call GET /M01039337/login to get current user
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.loggedIn) {
                return data.username;
            }
            return null;
            
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
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
     * Handle logout using AJAX call to DELETE /M01039337/login
     * @param {Event} e - Click event
     */
    async handleLogout(e) {
        e.preventDefault();
        
        try {
            // Call DELETE /M01039337/login to log out
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update UI for guest
                this.updateUIForGuest();
                
                // Redirect to home page
                if (window.blogManager) {
                    window.blogManager.showPage('home');
                }
            } else {
                console.error('Logout failed:', data.message);
                alert('Logout failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout. Please try again.');
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
}

// Initialise authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});