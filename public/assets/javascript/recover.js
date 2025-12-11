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

    // Redirecting to login page after delay
    redirectToLogin() {
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    // Handling recovery form submission
    async handleRecovery(e) {
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

        // Only username should be provided for password recovery
        if (!username) {
            this.displayMessage('Please provide your username to recover your password.');
            return;
        }

        if (password) {
            this.displayMessage('Password field is not used for recovery. Please only provide email and username.');
            return;
        }

        try {
            // Send password recovery request to server
            const response = await fetch(`${this.baseURL}/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    username: username,
                    password: undefined
                })
            });

            const data = await response.json();

            if (data.success && data.recovered) {
                // Success message with password displayed
                this.displayMessage(`✓ Password recovery successful! Your password is: ${data.password}`, true);
                this.redirectToLogin();
            } else {
                // Error message from server
                this.displayMessage(data.message || 'Account recovery failed.');
            }
        } catch (error) {
            console.error('Recovery error:', error);
            this.displayMessage('An error occurred during account recovery. Please try again.');
        }
    }
}

// Create instance of RecoveryManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.recoveryManager = new RecoveryManager();
});