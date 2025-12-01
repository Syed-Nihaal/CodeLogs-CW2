// Registration Manager class to handle user registration functionality
class RegistrationManager {
    constructor() {
        this.registerForm = document.getElementById('registerForm');
        this.messageLabel = document.getElementById('register-messageLabel');
        this.redirectDelay = 2000;
        
        this.init();
    }

    // Initialising registration manager and set up event listeners
    init() {
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    }

    // Displaying message to user
    displayMessage(message, isSuccess = false) {
        if (this.messageLabel) {
            this.messageLabel.textContent = message;
            this.messageLabel.style.color = isSuccess ? 'green' : 'red';
        }
    }

    // Clear any existing messages
    clearMessage() {
        if (this.messageLabel) {
            this.messageLabel.textContent = '';
        }
    }

    // Validate password match
    validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    // Check if username or email already exists
    checkUserExists(username, email) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        return users.find(user => user.username === username || user.email === email);
    }

    // Create new user object
    createUser(username, email, dob, password) {
        return {
            username: username,
            email: email,
            dob: dob,
            password: password // Note: In production, this should be hashed on the server
        };
    }

    // Handle successful registration
    handleSuccessfulRegistration() {
        this.displayMessage('Registration successful! Redirecting to login...', true);
        
        // Redirect to login page after delay
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    // Handle registration form submission
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