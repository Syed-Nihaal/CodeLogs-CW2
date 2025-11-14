// Account Recovery Manager class to handle account recovery functionality
class RecoveryManager {
    // Constructor to initialise the recovery manager
    constructor() {
        this.recoverForm = document.getElementById('recoverForm'); // Get recovery form element
        this.messageLabel = document.getElementById('messageLabel'); // Get message label element
        this.usersKey = 'users'; // LocalStorage key for users array
        this.redirectDelay = 2000; // Delay before redirecting (in milliseconds)
        
        this.init(); // Initialise the recovery manager
    }

    // Initialise event listeners
    init() {
        // Add submit event listener to recovery form
        this.recoverForm.addEventListener('submit', (e) => this.handleRecovery(e));
    }

    // Get all registered users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || []; // Return users array or empty array
    }

    // Find user by email address
    findUserByEmail(email) {
        const users = this.getUsers(); // Get all users
        return users.find(u => u.email === email); // Find user with matching email
    }

    // Display message to user
    displayMessage(message, isSuccess = false) {
        this.messageLabel.textContent = message; // Set message text
        this.messageLabel.style.color = isSuccess ? 'green' : 'red'; // Set colour based on success/failure
    }

    // Clear any existing messages
    clearMessage() {
        this.messageLabel.textContent = ''; // Clear message text
    }

    // Handle password recovery (when username is provided)
    handlePasswordRecovery(user, username) {
        // Verify username matches email
        if (user.username === username) {
            this.displayMessage(`Password recovery successful! Your password is: ${user.password}`, true);
            this.redirectToLogin(); // Redirect to login page after delay
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
            this.redirectToLogin(); // Redirect to login page after delay
            return true;
        } else {
            this.displayMessage('Password does not match the email address.');
            return false;
        }
    }

    // Redirect to login page after delay
    redirectToLogin() {
        setTimeout(() => {
            window.location.href = 'login.html'; // Redirect to login page
        }, this.redirectDelay);
    }

    // Handle recovery form submission
    handleRecovery(e) {
        e.preventDefault(); // Prevent default form submission behaviour

        // Get form input values and trim whitespace
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        this.clearMessage(); // Clear any previous messages

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
    new RecoveryManager(); // Create new RecoveryManager instance
});