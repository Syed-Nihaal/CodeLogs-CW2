// Account Recovery Manager class to handle account recovery functionality
class RecoveryManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;

        this.recoverForm = document.getElementById('recoverForm');
        this.messageLabel = document.getElementById('recover-messageLabel');
        this.redirectDelay = 2000;
        
        this.init();
    }

    // Initialise account recovery manager and set up event listeners
    init() {
        if (this.recoverForm) {
            this.recoverForm.addEventListener('submit', (e) => this.handleRecovery(e));
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

    // Finding user by email address
    findUserByEmail(email) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        return users.find(u => u.email === email);
    }

    // Handle password recovery (when username is provided)
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

    // Handle username recovery (when password is provided)
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

    // Redirecting to login page after delay
    redirectToLogin() {
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    // Handling recovery form submission
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