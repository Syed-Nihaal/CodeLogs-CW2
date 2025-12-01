// Creating Login Manager class
class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.messageLabel = document.getElementById('login-messageLabel');
        this.redirectDelay = 1500;
        
        this.init();
    }

    // Initialise login manager and set up event listeners
    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    // Displaying message to user
    displayMessage(message, isSuccess = false) {
        if (this.messageLabel) {
            this.messageLabel.textContent = message;
            this.messageLabel.style.color = isSuccess ? 'green' : 'red';
        }
    }

    // Clearing any existing messages
    clearMessage() {
        if (this.messageLabel) {
            this.messageLabel.textContent = '';
        }
    }

    // Validating user credential
    validateCredentials(username, password) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        return users.find(u => u.username === username && u.password === password);
    }

    // Handling successful login
    handleSuccessfulLogin(username) {
        this.displayMessage('Login successful! Redirecting...', true);
        
        // Store logged-in user using authManager
        if (window.authManager) {
            window.authManager.setLoggedInUser(username);
        }
        
        // Redirect to home page after delay
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('home');
                window.blogManager.loadRecentPosts();
            }
        }, this.redirectDelay);
    }

    // Handling failed login
    handleFailedLogin() {
        this.displayMessage('Invalid username or password. Please try again.');
    }

    // Handle login form submission
    handleLogin(e) {
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
        
        // Validate credentials
        const user = this.validateCredentials(username, password);
        
        if (user) {
            this.handleSuccessfulLogin(username);
        } else {
            this.handleFailedLogin();
        }
    }
}

// Create instance of LoginManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.loginManager = new LoginManager();
});