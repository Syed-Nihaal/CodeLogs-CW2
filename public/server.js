// Importing modules
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';

// Initialising Express application
const app = express();
app.use(bodyParser.json());
const PORT = 8080;

// Path based on Student ID
const STUDENT_ID = 'M01039337';

// Configuring session
app.use(expressSession({
    secret: 'secret',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: true
}));

// Configuring pasring
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Creating get route for testing server
app.get('/', (req, res) => {
    res.send('Express server is running on 8080.');
});

// Creating get route for testing Student ID path
app.get(`/${STUDENT_ID}/test`, (req, res) => {
    res.json({
        success: true,
        message: 'Student ID path is working correctly.',
        studentId: STUDENT_ID
    });
});

// Creating post route for creating a new user
app.post(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const { username, email, dob, password } = req.body;
        
        // Validating required fields
        if (!username || !email || !dob || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }
        
        // Validating username
        if (/\s/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username cannot contain spaces.'
            });
        }
        
        // Validating email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }
        
        // Validating password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }
        
        // Validating date of birth
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        // Checking if user's age is valid
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        // Checking if user is at least 10 years old
        if (age < 10) {
            return res.status(400).json({
                success: false,
                message: 'You must be at least 10 years old to register.'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'User registration validated.',
            data: { username, email, dob }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for searching users
app.get(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        res.json({
            success: true,
            message: 'User search endpoint ready.',
            searchQuery: searchQuery,
            users: []
        });
        
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for checking login status
app.get(`/${STUDENT_ID}/login`, (req, res) => {
    res.json({
        success: true,
        message: 'Login status endpoint ready.',
        loggedIn: false
    });
});

// Creating post route for logging in
app.post(`/${STUDENT_ID}/login`, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validating required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }
        
        res.json({
            success: true,
            message: 'Login endpoint ready.',
            username: username
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating delete route for logging out
app.delete(`/${STUDENT_ID}/login`, (req, res) => {
    res.json({
        success: true,
        message: 'Logout endpoint ready.'
    });
});

// Creating post route for creating content
app.post(`/${STUDENT_ID}/contents`, async (req, res) => {
    try {
        const { title, description, code, language } = req.body;
        
        // Validating required fields
        if (!title || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Title, code, and language are required.'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Content creation endpoint ready.',
            data: { title, code, language }
        });
        
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for searching content
app.get(`/${STUDENT_ID}/contents`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        res.json({
            success: true,
            message: 'Content search endpoint ready.',
            searchQuery: searchQuery,
            contents: []
        });
        
    } catch (error) {
        console.error('Content search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Creating post route for following a user
app.post(`/${STUDENT_ID}/follow`, async (req, res) => {
    try {
        const { username } = req.body;
        
        // Validating required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required.'
            });
        }
        
        res.json({
            success: true,
            message: 'Follow endpoint ready.',
            following: username
        });
        
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Creating delete route for unfollowing a user
app.delete(`/${STUDENT_ID}/follow`, async (req, res) => {
    try {
        const { username } = req.body;
        
        // Validate required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required.'
            });
        }
        
        res.json({
            success: true,
            message: 'Unfollow endpoint ready.',
            unfollowed: username
        });
        
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for getting feed
app.get(`/${STUDENT_ID}/feed`, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Feed endpoint ready.',
            contents: []
        });
        
    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Starting the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Student ID path: http://localhost:${PORT}/${STUDENT_ID}/`);
});