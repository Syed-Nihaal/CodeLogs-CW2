// Import modules
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import { connectDB, getDB } from './assets/javascript/connect_db.js';
import { ObjectId } from 'mongodb';

// Initialise Express application
const app = express();
app.use(bodyParser.json());
const PORT = 8080;

// Path based on Student ID - REPLACE WITH YOUR ACTUAL STUDENT ID
const STUDENT_ID = 'M01039337';

// Configuring session middleware
app.use(expressSession({
    secret: 'secret-key-change-in-production',
    cookie: { maxAge: 3600000 }, // 1 hour session timeout
    resave: false,
    saveUninitialized: false
}));

// Configuring parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB before starting server
connectDB().then(() => {
    console.log('MongoDB connection established successfully');
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});


// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate date of birth (user must be at least 10 years old)
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Get test route for server
app.get(`/${STUDENT_ID}/`, (req, res) => {
    res.send('CodeLogs Express server is running on port 8080.');
});

// Get test route for verifying Student ID path
app.get(`/${STUDENT_ID}/test`, (req, res) => {
    res.json({
        success: true,
        message: 'Student ID path is working correctly.',
        studentId: STUDENT_ID
    });
});


// Post route for registering a new user
app.post(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const { username, email, dob, password } = req.body;
        
        // Validate required fields
        if (!username || !email || !dob || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields (username, email, dob, password) are required.'
            });
        }
        
        // Validate username (no spaces allowed)
        if (/\s/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username cannot contain spaces.'
            });
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }
        
        // Validate password length (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }
        
        // Validate age (must be at least 10 years old)
        const age = calculateAge(dob);
        if (age < 10) {
            return res.status(400).json({
                success: false,
                message: 'You must be at least 10 years old to register.'
            });
        }
        
        // Get database instance and collections
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
            password: password, // NOTE: In production, hash this password using bcrypt!
            createdAt: new Date()
        };
        
        // Insert user into database
        const result = await usersCollection.insertOne(newUser);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            userId: result.insertedId,
            username: username
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration.'
        });
    }
});

// Get route for searching for users
app.get(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Search for users matching query (case-insensitive)
        // Only return username and email, exclude password
        const users = await usersCollection.find({
            username: { $regex: searchQuery, $options: 'i' }
        }).project({
            username: 1,
            email: 1,
            _id: 1
        }).toArray();
        
        res.json({
            success: true,
            message: 'User search completed successfully.',
            searchQuery: searchQuery,
            count: users.length,
            users: users
        });
        
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during user search.'
        });
    }
});

// Get route for checking login status
app.get(`/${STUDENT_ID}/login`, (req, res) => {
    const loggedIn = req.session.userId ? true : false;
    const username = req.session.username || null;
    
    res.json({
        success: true,
        loggedIn: loggedIn,
        username: username,
        userId: req.session.userId || null
    });
});

// Post route for logging in a user
app.post(`/${STUDENT_ID}/login`, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate required fields
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
            password: password
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
            username: user.username,
            userId: user._id.toString()
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login.'
        });
    }
});

// Delete route for logging out a user
app.delete(`/${STUDENT_ID}/login`, (req, res) => {
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed. Please try again.'
            });
        }
        
        res.json({
            success: true,
            message: 'Logout successful.'
        });
    });
});

// Post route for creating new content
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
        
        // Validate required fields
        if (!title || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Title, code, and language are required fields.'
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
            contentId: result.insertedId,
            title: title,
            author: req.session.username
        });
        
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during content creation.'
        });
    }
});

// Get route for searching for contents
app.get(`/${STUDENT_ID}/contents`, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        // Get database instance
        const db = getDB();
        const contentsCollection = db.collection('contents');
        
        // Search for contents matching query in title, description, or language (case-insensitive)
        const contents = await contentsCollection.find({
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { language: { $regex: searchQuery, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            success: true,
            message: 'Content search completed successfully.',
            searchQuery: searchQuery,
            count: contents.length,
            contents: contents
        });
        
    } catch (error) {
        console.error('Content search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during content search.'
        });
    }
});

// Post route for following another user
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
        
        // Validate required fields
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
        const followsCollection = db.collection('follows');
        const usersCollection = db.collection('users');
        
        // Check if target user exists
        const targetUser = await usersCollection.findOne({ username: username });
        
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Check if already following
        const existingFollow = await followsCollection.findOne({
            follower: req.session.username,
            following: username
        });
        
        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: `You are already following ${username}.`
            });
        }
        
        // Create follow relationship
        await followsCollection.insertOne({
            follower: req.session.username,
            followerId: new ObjectId(req.session.userId),
            following: username,
            followingId: targetUser._id,
            createdAt: new Date()
        });
        
        res.json({
            success: true,
            message: `You are now following ${username}.`,
            following: username
        });
        
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during follow operation.'
        });
    }
});

// Delete route for unfollowing another user
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
        
        // Validate required fields
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const followsCollection = db.collection('follows');
        
        // Remove follow relationship
        const result = await followsCollection.deleteOne({
            follower: req.session.username,
            following: username
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: `You are not following ${username}.`
            });
        }
        
        res.json({
            success: true,
            message: `You have unfollowed ${username}.`,
            unfollowed: username
        });
        
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during unfollow operation.'
        });
    }
});


// Get route for feed
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
        const followsCollection = db.collection('follows');
        const contentsCollection = db.collection('contents');
        
        // Get list of users the current user is following
        const followingList = await followsCollection.find({
            follower: req.session.username
        }).toArray();
        
        // Extract usernames of followed users
        const followedUsernames = followingList.map(follow => follow.following);
        
        // If not following anyone, return empty feed
        if (followedUsernames.length === 0) {
            return res.json({
                success: true,
                message: 'Your feed is empty. Follow users to see their posts.',
                count: 0,
                contents: []
            });
        }
        
        // Get contents ONLY from followed users
        const contents = await contentsCollection.find({
            author: { $in: followedUsernames }
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            success: true,
            message: 'Feed retrieved successfully.',
            count: contents.length,
            contents: contents
        });
        
    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during feed retrieval.'
        });
    }
});

// Get route for user stats
app.get(`/${STUDENT_ID}/users/:username/stats`, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        const contentsCollection = db.collection('contents');
        const followsCollection = db.collection('follows');
        
        // Check if user exists
        const user = await usersCollection.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Get posts count
        const postsCount = await contentsCollection.countDocuments({ author: username });
        
        // Get followers count
        const followersCount = await followsCollection.countDocuments({ following: username });
        
        // Get following count
        const followingCount = await followsCollection.countDocuments({ follower: username });
        
        res.json({
            success: true,
            username: username,
            stats: {
                posts: postsCount,
                followers: followersCount,
                following: followingCount
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during stats retrieval.'
        });
    }
});

// Get route for followers
app.get(`/${STUDENT_ID}/users/:username/followers`, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Get database instance
        const db = getDB();
        const followsCollection = db.collection('follows');
        const usersCollection = db.collection('users');
        
        // Check if user exists
        const user = await usersCollection.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Get followers (users who follow this username)
        const followers = await followsCollection.find({
            following: username
        }).toArray();
        
        // Get detailed user information for each follower
        const followerUsernames = followers.map(f => f.follower);
        const followerDetails = await usersCollection.find({
            username: { $in: followerUsernames }
        }).project({
            username: 1,
            email: 1,
            _id: 1
        }).toArray();
        
        res.json({
            success: true,
            username: username,
            count: followerDetails.length,
            followers: followerDetails
        });
        
    } catch (error) {
        console.error('Followers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during followers retrieval.'
        });
    }
});

// Get route for following
app.get(`/${STUDENT_ID}/users/:username/following`, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Get database instance
        const db = getDB();
        const followsCollection = db.collection('follows');
        const usersCollection = db.collection('users');
        
        // Check if user exists
        const user = await usersCollection.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Get following (users that this username follows)
        const following = await followsCollection.find({
            follower: username
        }).toArray();
        
        // Get detailed user information for each followed user
        const followingUsernames = following.map(f => f.following);
        const followingDetails = await usersCollection.find({
            username: { $in: followingUsernames }
        }).project({
            username: 1,
            email: 1,
            _id: 1
        }).toArray();
        
        res.json({
            success: true,
            username: username,
            count: followingDetails.length,
            following: followingDetails
        });
        
    } catch (error) {
        console.error('Following error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during following retrieval.'
        });
    }
});

// Get route for user posts
app.get(`/${STUDENT_ID}/users/:username/posts`, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        const contentsCollection = db.collection('contents');
        
        // Check if user exists
        const user = await usersCollection.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Get all posts by this user
        const posts = await contentsCollection.find({
            author: username
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            success: true,
            username: username,
            count: posts.length,
            posts: posts
        });
        
    } catch (error) {
        console.error('User posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during posts retrieval.'
        });
    }
});

// Get route for user profile
app.get(`/${STUDENT_ID}/users/:username/profile`, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        const contentsCollection = db.collection('contents');
        const followsCollection = db.collection('follows');
        
        // Get user information (exclude password)
        const user = await usersCollection.findOne(
            { username: username },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Get statistics
        const postsCount = await contentsCollection.countDocuments({ author: username });
        const followersCount = await followsCollection.countDocuments({ following: username });
        const followingCount = await followsCollection.countDocuments({ follower: username });
        
        // Check if current user is following this profile
        let isFollowing = false;
        if (req.session.username && req.session.username !== username) {
            const followRelation = await followsCollection.findOne({
                follower: req.session.username,
                following: username
            });
            isFollowing = !!followRelation;
        }
        
        res.json({
            success: true,
            profile: {
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                stats: {
                    posts: postsCount,
                    followers: followersCount,
                    following: followingCount
                },
                isFollowing: isFollowing
            }
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during profile retrieval.'
        });
    }
});

// Use 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.'
    });
});

// Use global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred.'
    });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Website is running on http://localhost:${PORT}/${STUDENT_ID}/`);
});