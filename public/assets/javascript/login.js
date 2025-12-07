// Login Manager class
// Handles user login functionality with AJAX calls to backend
class LoginManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        this.loginForm = document.getElementById('loginForm');
        this.messageLabel = document.getElementById('login-messageLabel');
        this.redirectDelay = 1500;
        
        this.init();
    }

    /**
     * Initialise login manager and set up event listeners
     */
    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    /**
     * Display message to user
     * @param {string} message - Message to display
     * @param {boolean} isSuccess - Whether message is a success message
     */
    displayMessage(message, isSuccess = false) {
        if (this.messageLabel) {
            this.messageLabel.textContent = message;
            this.messageLabel.style.color = isSuccess ? 'green' : 'red';
        }
    }

    /**
     * Clear any existing messages
     */
    clearMessage() {
        if (this.messageLabel) {
            this.messageLabel.textContent = '';
        }
    }

    /**
     * Handle successful login
     * @param {string} username - Username of logged-in user
     */
    handleSuccessfulLogin(username) {
        this.displayMessage('Login successful! Redirecting...', true);
        
        // Update UI using authManager
        if (window.authManager) {
            window.authManager.updateUIForLoggedInUser(username);
        }
        
        // Redirect to home page after delay
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('home');
                window.blogManager.loadRecentPosts();
            }
        }, this.redirectDelay);
    }

    /**
     * Handle failed login
     * @param {string} message - Error message to display
     */
    handleFailedLogin(message) {
        this.displayMessage(message || 'Invalid username or password. Please try again.');
    }

    /**
     * Handle login form submission using AJAX
     * Sends POST request to /M01039337/login
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        // Get form input values and trim whitespace
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        this.clearMessage();
        
        // Basic validation
        if (!username || !password) {
            this.displayMessage('Please enter both username and password.');
            return;
        }
        
        try {
            // Send POST request to /M01039337/login with credentials
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin', // Include session cookie
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            // Parse JSON response
            const data = await response.json();
            
            // Handle response based on success status
            if (data.success) {
                // Login successful
                this.handleSuccessfulLogin(data.username);
            } else {
                // Login failed - display error message
                this.handleFailedLogin(data.message);
            }
            
        } catch (error) {
            // Handle network or parsing errors
            console.error('Login error:', error);
            this.displayMessage('An error occurred during login. Please try again.');
        }
    }
}

// Create instance of LoginManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.loginManager = new LoginManager();
});