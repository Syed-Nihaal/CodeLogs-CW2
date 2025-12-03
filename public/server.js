// Importing modules
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import { connectDB, getDB } from './database/db.js';
import { ObjectId } from 'mongodb';

// Initialising Express application
const app = express();
app.use(bodyParser.json());
const PORT = 8080;

// Path based on Student ID
const STUDENT_ID = 'M01039337';

// Configuring session
app.use(expressSession({
    secret: 'secret-key-change-in-production',
    cookie: { maxAge: 3600000 }, // 1 hour
    resave: false,
    saveUninitialized: false
}));

// Configuring parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB before starting server
connectDB().then(() => {
    console.log('MongoDB connection established');
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});

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

// Creating post route for creating a new user (with MongoDB)
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
        
        // Validating username (no spaces)
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
        
        // Validating password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }
        
        // Validating date of birth (must be at least 10 years old)
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 10) {
            return res.status(400).json({
                success: false,
                message: 'You must be at least 10 years old to register.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Check if username or email already exists
        const existingUser = await usersCollection.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists.'
            });
        }
        
        // Create new user object
        const newUser = {
            username: username,
            email: email,
            dob: dob,
            password: password, // Note: In production, hash this password!
            createdAt: new Date(),
            following: [] // Array to store usernames of followed users
        };
        
        // Insert user into database
        const result = await usersCollection.insertOne(newUser);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                userId: result.insertedId,
                username: username,
                email: email,
                dob: dob
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for searching users (with MongoDB)
app.get(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Search for users matching query (case-insensitive)
        const users = await usersCollection.find({
            username: { $regex: searchQuery, $options: 'i' }
        }).project({
            username: 1,
            email: 1,
            _id: 1
        }).toArray();
        
        res.json({
            success: true,
            message: 'User search completed.',
            searchQuery: searchQuery,
            users: users
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
    const loggedIn = req.session.userId ? true : false;
    const username = req.session.username || null;
    
    res.json({
        success: true,
        loggedIn: loggedIn,
        username: username
    });
});

// Creating post route for logging in (with MongoDB)
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
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Find user in database
        const user = await usersCollection.findOne({
            username: username,
            password: password // Note: In production, compare hashed passwords!
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }
        
        // Store user information in session
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        
        res.json({
            success: true,
            message: 'Login successful.',
            username: user.username
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
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed.'
            });
        }
        
        res.json({
            success: true,
            message: 'Logout successful.'
        });
    });
});

// Creating post route for creating content (with MongoDB)
app.post(`/${STUDENT_ID}/contents`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to create content.'
            });
        }
        
        const { title, description, code, language } = req.body;
        
        // Validating required fields
        if (!title || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Title, code, and language are required.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const contentsCollection = db.collection('contents');
        
        // Create new content object
        const newContent = {
            title: title,
            description: description || '',
            code: code,
            language: language,
            author: req.session.username,
            authorId: new ObjectId(req.session.userId),
            createdAt: new Date()
        };
        
        // Insert content into database
        const result = await contentsCollection.insertOne(newContent);
        
        res.status(201).json({
            success: true,
            message: 'Content created successfully.',
            data: {
                contentId: result.insertedId,
                title: title,
                author: req.session.username
            }
        });
        
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating get route for searching content (with MongoDB)
app.get(`/${STUDENT_ID}/contents`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        // Get database instance
        const db = getDB();
        const contentsCollection = db.collection('contents');
        
        // Search for contents matching query in title, description, or language
        const contents = await contentsCollection.find({
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { language: { $regex: searchQuery, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            success: true,
            message: 'Content search completed.',
            searchQuery: searchQuery,
            contents: contents
        });
        
    } catch (error) {
        console.error('Content search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating post route for following a user (with MongoDB)
app.post(`/${STUDENT_ID}/follow`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to follow users.'
            });
        }
        
        const { username } = req.body;
        
        // Validating required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required.'
            });
        }
        
        // Prevent users from following themselves
        if (username === req.session.username) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Check if target user exists
        const targetUser = await usersCollection.findOne({ username: username });
        
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Add to following array (using $addToSet to avoid duplicates)
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $addToSet: { following: username } }
        );
        
        res.json({
            success: true,
            message: `You are now following ${username}.`,
            following: username
        });
        
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Creating delete route for unfollowing a user (with MongoDB)
app.delete(`/${STUDENT_ID}/follow`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to unfollow users.'
            });
        }
        
        const { username } = req.body;
        
        // Validating required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Remove from following array
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $pull: { following: username } }
        );
        
        res.json({
            success: true,
            message: `You have unfollowed ${username}.`,
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

// Creating get route for getting feed (with MongoDB)
app.get(`/${STUDENT_ID}/feed`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your feed.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        const contentsCollection = db.collection('contents');
        
        // Get current user's following list
        const currentUser = await usersCollection.findOne(
            { _id: new ObjectId(req.session.userId) },
            { projection: { following: 1 } }
        );
        
        const followingList = currentUser?.following || [];
        
        // If not following anyone, return empty feed
        if (followingList.length === 0) {
            return res.json({
                success: true,
                message: 'Your feed is empty. Follow users to see their posts.',
                contents: []
            });
        }
        
        // Get contents from followed users only
        const contents = await contentsCollection.find({
            author: { $in: followingList }
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            success: true,
            message: 'Feed retrieved successfully.',
            contents: contents
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