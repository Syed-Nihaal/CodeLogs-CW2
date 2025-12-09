// Registration Manager class
// Handles user registration functionality with AJAX calls to backend
class RegistrationManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        this.registerForm = document.getElementById('registerForm');
        this.messageLabel = document.getElementById('register-messageLabel');
        this.redirectDelay = 2000;
        
        this.init();
    }

    /**
     * Initialise registration manager and set up event listeners
     */
    init() {
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
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
     * Validate password match
     * @param {string} password - Password
     * @param {string} confirmPassword - Confirmation password
     * @returns {boolean} True if passwords match
     */
    validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Handle successful registration
     */
    handleSuccessfulRegistration() {
        this.displayMessage('Registration successful! Redirecting to login...', true);
        console.log('Registration successful');
        
        // Redirect to login page after delay
        setTimeout(() => {
            if (window.blogManager) {
                window.blogManager.showPage('login');
            }
        }, this.redirectDelay);
    }

    /**
     * Handle registration form submission using AJAX
     * Sends POST request to /M01039337/users
     * @param {Event} e - Form submit event
     */
    async handleRegistration(e) {
        e.preventDefault();
        
        // Get form input values and trim whitespace
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const countryCode = document.getElementById('register-country-code').value.trim();
        const phoneNumber = document.getElementById('register-phone-number').value.trim();
        const dob = document.getElementById('register-dob').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        
        this.clearMessage();

        // Validate all fields are filled
        if (!username || !email || !countryCode || !phoneNumber || !dob || !password || !confirmPassword) {
            this.displayMessage('All fields (username, email, phone, dob, password) are required.');
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

        try {
            // Send POST request to /M01039337/users with registration data
            const response = await fetch(`${this.baseURL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    phone: countryCode + phoneNumber,
                    dob: dob,
                    password: password
                })
            });
            
            // Parse JSON response
            const data = await response.json();
            
            // Handle response based on success status
            if (data.success) {
                // Registration successful
                this.handleSuccessfulRegistration();
            } else {
                // Registration failed - display error message
                this.displayMessage(data.message || 'Registration failed. Please try again.');
            }
            
        } catch (error) {
            // Handle network or parsing errors
            console.error('Registration error:', error);
            this.displayMessage('An error occurred during registration. Please try again.');
        }
    }
}

// Create instance of RegistrationManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.registrationManager = new RegistrationManager();
});