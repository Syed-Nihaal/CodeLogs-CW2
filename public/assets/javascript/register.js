// Registration Manager class to handle user registration functionality
class RegistrationManager {
    constructor() {
        this.registerForm = document.getElementById('registerForm');
        this.messageLabel = document.getElementById('register-messageLabel');
        this.redirectDelay = 2000;
        
        this.init();
    }

    /**
     * Initialise registration manager
     * Set up event listeners
     */
    init() {
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
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
     * Validate password match
     * @param {string} password - Password
     * @param {string} confirmPassword - Confirm password
     * @returns {boolean} True if passwords match
     */
    validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Check if username or email already exists
     * TODO: This will be replaced with backend validation
     * @param {string} username - Username to check
     * @param {string} email - Email to check
     * @returns {Object|null} Existing user if found, null otherwise
     */
    checkUserExists(username, email) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        return users.find(user => user.username === username || user.email === email);
    }

    /**
     * Create new user object
     * @param {string} username - Username
     * @param {string} email - Email address
     * @param {string} dob - Date of birth
     * @param {string} password - Password
     * @returns {Object} User object
     */
    createUser(username, email, dob, password) {
        return {
            username: username,
            email: email,
            dob: dob,
            password: password // Note: In production, this should be hashed on the server
        };
    }

    /**
     * Handle successful registration
     */
    handleSuccessfulRegistration() {
        this.displayMessage('Registration successful! Redirecting to login...', true);
        
        // Redirect to login page after delay
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    /**
     * Handle registration form submission
     * @param {Event} e - Form submit event
     */
    handleRegistration(e) {
        e.preventDefault();
        
        // Get form input values and trim whitespace
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const dob = document.getElementById('register-dob').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        
        this.clearMessage();

        // Validate all fields are filled
        if (!username || !email || !dob || !password || !confirmPassword) {
            this.displayMessage('Please fill in all fields.');
            return;
        }

        // Validate username (no spaces allowed)
        if (window.authManager && !window.authManager.validateUsername(username)) {
            this.displayMessage('Username cannot contain any spaces.');
            return;
        }

        // Validate email format
        if (window.authManager && !window.authManager.validateEmail(email)) {
            this.displayMessage('Please enter a valid email address.');
            return;
        }

        // Validate password strength
        if (window.authManager && !window.authManager.validatePasswordStrength(password)) {
            this.displayMessage('Password must be at least 6 characters long.');
            return;
        }

        // Validate date of birth - user must be at least 10 years old
        if (window.authManager && !window.authManager.validateDateOfBirth(dob)) {
            this.displayMessage('You must be at least 10 years old to register.');
            return;
        }

        // Validate password match
        if (!this.validatePasswordMatch(password, confirmPassword)) {
            this.displayMessage('Passwords do not match. Please try again.');
            return;
        }

        // Check if user already exists
        // TODO: Replace with AJAX call to check backend
        const userExists = this.checkUserExists(username, email);
        if (userExists) {
            this.displayMessage('Username or email already exists. Please choose another.');
            return;
        }

        // Create new user and save
        // TODO: Replace with AJAX call to POST /M00XXXXX/users
        const users = window.authManager ? window.authManager.getUsers() : [];
        const newUser = this.createUser(username, email, dob, password);
        users.push(newUser);
        
        if (window.authManager) {
            window.authManager.saveUsers(users);
        }
        
        this.handleSuccessfulRegistration();
    }
}

// Create instance of RegistrationManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.registrationManager = new RegistrationManager();
});