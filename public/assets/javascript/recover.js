// Account Recovery Manager class to handle account recovery functionality
class RecoveryManager {
    constructor() {
        this.recoverForm = document.getElementById('recoverForm');
        this.messageLabel = document.getElementById('recover-messageLabel');
        this.redirectDelay = 2000;
        
        this.init();
    }

    /**
     * Initialise recovery manager
     * Set up event listeners
     */
    init() {
        if (this.recoverForm) {
            this.recoverForm.addEventListener('submit', (e) => this.handleRecovery(e));
        }
    }

    /**
     * Display message to user
     * @param {string} message - Message to display
     * @param {boolean} isSuccess - Whether message is success or error
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
     * Find user by email address
     * TODO: Replace with AJAX call to backend
     * @param {string} email - Email address to search
     * @returns {Object|null} User object if found, null otherwise
     */
    findUserByEmail(email) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        return users.find(u => u.email === email);
    }

    /**
     * Handle password recovery (when username is provided)
     * @param {Object} user - User object
     * @param {string} username - Username provided by user
     * @returns {boolean} True if successful, false otherwise
     */
    handlePasswordRecovery(user, username) {
        // Verify username matches email
        if (user.username === username) {
            this.displayMessage(`Password recovery successful! Your password is: ${user.password}`, true);
            this.redirectToLogin();
            return true;
        } else {
            this.displayMessage('Username does not match the email address.');
            return false;
        }
    }

    /**
     * Handle username recovery (when password is provided)
     * @param {Object} user - User object
     * @param {string} password - Password provided by user
     * @returns {boolean} True if successful, false otherwise
     */
    handleUsernameRecovery(user, password) {
        // Verify password matches email
        if (user.password === password) {
            this.displayMessage(`Username recovery successful! Your username is: ${user.username}`, true);
            this.redirectToLogin();
            return true;
        } else {
            this.displayMessage('Password does not match the email address.');
            return false;
        }
    }

    /**
     * Redirect to login page after delay
     */
    redirectToLogin() {
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    /**
     * Handle recovery form submission
     * @param {Event} e - Form submit event
     */
    handleRecovery(e) {
        e.preventDefault();

        // Get form input values and trim whitespace
        const email = document.getElementById('recover-email').value.trim();
        const username = document.getElementById('recover-username').value.trim();
        const password = document.getElementById('recover-password').value.trim();

        this.clearMessage();

        // Validate email is provided
        if (!email) {
            this.displayMessage('Please enter your email address.');
            return;
        }

        // Validate email format
        if (window.authManager && !window.authManager.validateEmail(email)) {
            this.displayMessage('Please enter a valid email address.');
            return;
        }

        // Find user by email
        // TODO: Replace with AJAX call to backend
        const user = this.findUserByEmail(email);

        // Case 1: Email not found
        if (!user) {
            this.displayMessage('No account found with this email address.');
            return;
        }

        // Case 2: User entered email + username (recover password)
        if (username && !password) {
            this.handlePasswordRecovery(user, username);
            return;
        }

        // Case 3: User entered email + password (recover username)
        if (password && !username) {
            this.handleUsernameRecovery(user, password);
            return;
        }

        // Case 4: User entered both username and password or neither
        this.displayMessage('Please provide either email + username OR email + password for recovery.');
    }
}

// Create instance of RecoveryManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.recoveryManager = new RecoveryManager();
});