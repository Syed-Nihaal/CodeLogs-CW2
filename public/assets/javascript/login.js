// Creating Login Manager class
class LoginManager {
    // Constructor to initialise the login manager
    constructor() {
        this.loginForm = document.getElementById('loginForm'); // Get login form element
        this.messageLabel = document.getElementById('messageLabel'); // Get message label element
        this.usersKey = 'users'; // LocalStorage key for users array
        this.loggedInUserKey = 'loggedInUser'; // LocalStorage key for logged-in user
        this.sessionUserKey = 'currentUser'; // SessionStorage key for current user session
        this.redirectDelay = 1500; // Delay before redirecting (in milliseconds)
        
        this.init(); // Initialise the login manager
    }

    // Initialise event listeners
    init() {
        // Add submit event listener to login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Get all registered users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || []; // Return users array or empty array
    }

    // Validate user credentials
    validateCredentials(username, password) {
        const users = this.getUsers(); // Get all users
        // Find user with matching username and password
        return users.find(u => u.username === username && u.password === password);
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

    // Handle successful login
    handleSuccessfulLogin(username) {
        this.displayMessage('Login successful! Redirecting...', true); // Display success message
        
        // Store logged-in user in both localStorage and sessionStorage
        localStorage.setItem(this.loggedInUserKey, username); // Store in localStorage for persistence
        sessionStorage.setItem(this.sessionUserKey, username); // Store in sessionStorage for current session
        
        // Redirect to game page after delay
        setTimeout(() => {
            window.location.href = 'game.html'; // Redirect to game page
        }, this.redirectDelay);
    }

    // Handle failed login
    handleFailedLogin() {
        this.displayMessage('Invalid username or password. Please try again.'); // Display error message
    }

    // Handle login form submission
    handleLogin(e) {
        e.preventDefault(); // Prevent default form submission behaviour
        
        // Get form input values and trim whitespace
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        this.clearMessage(); // Clear any previous messages
        
        // Validate credentials
        const user = this.validateCredentials(username, password);
        
        // Handle login result
        if (user) {
            this.handleSuccessfulLogin(username); // Handle successful login
        } else {
            this.handleFailedLogin(); // Handle failed login
        }
    }
}

// Create instance of LoginManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new LoginManager(); // Create new LoginManager instance
});