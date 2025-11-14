// Registration Manager class to handle user registration functionality
class RegistrationManager {
    // Constructor to initialise the registration manager
    constructor() {
        this.registerForm = document.getElementById('registerForm'); // Get registration form element
        this.messageLabel = document.getElementById('messageLabel'); // Get message label element
        this.usersKey = 'users'; // LocalStorage key for users array
        this.redirectDelay = 2000; // Delay before redirecting (in milliseconds)
        
        this.init(); // Initialise the registration manager
    }

    // Initialise event listeners
    init() {
        // Add submit event listener to registration form
        this.registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
    }

    // Get all registered users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || []; // Return users array or empty array
    }

    // Save users array to localStorage
    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users)); // Save users to localStorage
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

    // Validate password match
    validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword; // Check if passwords match
    }

    // Check if username or email already exists
    checkUserExists(username, email) {
        const users = this.getUsers(); // Get all users
        // Find user with matching username or email
        return users.find(user => user.username === username || user.email === email);
    }

    // Validate email format using regex
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
        return emailRegex.test(email); // Test email against regex
    }

    // Validate password strength (minimum 6 characters)
    validatePasswordStrength(password) {
        return password.length >= 6; // Check if password is at least 6 characters
    }

    // Validate username (no spaces allowed)
    validateUsername(username) {
        const usernameRegex = /^\S+$/; // No whitespace characters allowed
        return usernameRegex.test(username); // Test username against regex
    }

    // Validate date of birth - user must be at least 10 years old
    validateDateOfBirth(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        
        // Check if date is valid
        if (isNaN(birthDate.getTime())) return false;
        
        // Check if date is not in future
        if (birthDate > today) return false;
        
        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Check if user is at least 10 years old
        return age >= 10;
    }

    // Create new user object
    createUser(username, email, dob, password) {
        return {
            username: username, // Username
            email: email, // Email address
            dob: dob, // Date of birth
            password: password // Password (Note: In production, this should be hashed)
        };
    }

    // Handle successful registration
    handleSuccessfulRegistration() {
        this.displayMessage('Registration successful! Redirecting to login...', true); // Display success message
        
        // Redirect to login page after delay
        setTimeout(() => {
            window.location.href = 'login.html'; // Redirect to login page
        }, this.redirectDelay);
    }

    // Handle registration form submission
    handleRegistration(e) {
        e.preventDefault(); // Prevent default form submission behaviour
        
        // Get form input values and trim whitespace
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const dob = document.getElementById('dob').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        
        this.clearMessage(); // Clear any previous messages

        // Validate username (no spaces allowed)
        if (!this.validateUsername(username)) {
            this.displayMessage('Username cannot contain any spaces.');
            return;
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            this.displayMessage('Please enter a valid email address.');
            return;
        }

        // Validate password strength
        if (!this.validatePasswordStrength(password)) {
            this.displayMessage('Password must be at least 6 characters long.');
            return;
        }

        // Validate date of birth - user must be at least 10 years old
        if (!this.validateDateOfBirth(dob)) {
            this.displayMessage('You must be at least 10 years old to register.');
            return;
        }

        // Validate password match
        if (!this.validatePasswordMatch(password, confirmPassword)) {
            this.displayMessage('Passwords do not match. Please try again.');
            return;
        }

        // Check if user already exists
        const userExists = this.checkUserExists(username, email);
        if (userExists) {
            this.displayMessage('Username or email already exists. Please choose another.');
            return;
        }

        // Create new user and save to localStorage
        const users = this.getUsers(); // Get existing users
        const newUser = this.createUser(username, email, dob, password); // Create new user object
        users.push(newUser); // Add new user to users array
        this.saveUsers(users); // Save updated users array to localStorage
        
        this.handleSuccessfulRegistration(); // Handle successful registration
    }
}

// Create instance of RegistrationManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new RegistrationManager(); // Create new RegistrationManager instance
});