// Import modules
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import bcrypt from 'bcrypt';
import { connectDB, getDB } from './connect_db.js';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialise Express application
const app = express();
app.use(bodyParser.json());
const PORT = 8080;

// Path based on Student ID
const STUDENT_ID = 'M01039337';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'assets', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    // Accept images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and common file types are allowed!'));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Configuring session middleware
app.use(expressSession({
    secret: 'secret-key-change-in-production',
    cookie: { maxAge: 3600000 }, // 1 hour session timeout
    resave: false,
    saveUninitialized: false
}));

// Configuring parsing middleware and static file serving
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(`/${STUDENT_ID}`, express.static(path.join(__dirname, 'public'), {
    index: 'index.html'
}));

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

// Redirect root to student ID path
app.get('/', (req, res) => {
    res.redirect(`/${STUDENT_ID}/`);
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
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user object
        const newUser = {
            username: username,
            email: email,
            dob: dob,
            password: hashedPassword,
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
            username: username
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }
        
        // Compare passwords using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
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
        
        const { title, description, code, programmingLanguage } = req.body;
        
        // Validate required fields
        if (!title || !code || !programmingLanguage) {
            return res.status(400).json({
                success: false,
                message: 'Title, code, and programmingLanguage are required fields.'
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
            programmingLanguage: programmingLanguage,
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
        
        // Search for contents matching query in title, description, or programmingLanguage (case-insensitive)
        const contents = await contentsCollection.find({
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { programmingLanguage: { $regex: searchQuery, $options: 'i' } }
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


// Get route for feed with pagination
app.get(`/${STUDENT_ID}/feed`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your feed.'
            });
        }
        
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page
        const skip = (page - 1) * limit;
        
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
                page: page,
                limit: limit,
                totalCount: 0,
                totalPages: 0,
                count: 0,
                contents: []
            });
        }
        
        // Get total count for pagination
        const totalCount = await contentsCollection.countDocuments({
            author: { $in: followedUsernames }
        });
        const totalPages = Math.ceil(totalCount / limit);
        
        // Get contents ONLY from followed users with pagination
        const contents = await contentsCollection.find({
            author: { $in: followedUsernames }
        }).sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        
        res.json({
            success: true,
            message: 'Feed retrieved successfully.',
            page: page,
            limit: limit,
            totalCount: totalCount,
            totalPages: totalPages,
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
            profileImage: 1,
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
            profileImage: 1,
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

// Get route for user posts with pagination
app.get(`/${STUDENT_ID}/users/:username/posts`, async (req, res) => {
    try {
        const username = req.params.username;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
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
        
        // Get total count for pagination
        const totalCount = await contentsCollection.countDocuments({ author: username });
        const totalPages = Math.ceil(totalCount / limit);
        
        // Get all posts by this user with pagination
        const posts = await contentsCollection.find({
            author: username
        }).sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        
        res.json({
            success: true,
            username: username,
            page: page,
            limit: limit,
            totalCount: totalCount,
            totalPages: totalPages,
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
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                stats: {
                    posts: postsCount,
                    likes: 0, // Placeholder for future likes feature
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

// NEW: Post route for uploading profile image
app.post(`/${STUDENT_ID}/upload/profile-image`, upload.single('profileImage'), async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to upload profile image.'
            });
        }
        
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Update user's profile image
        const imageUrl = `/assets/uploads/${req.file.filename}`;
        await usersCollection.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $set: { profileImage: imageUrl } }
        );
        
        res.json({
            success: true,
            message: 'Profile image uploaded successfully.',
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during image upload.'
        });
    }
});

// Use 404 handler for undefined routes
app.use((req, res, next) => {
    if (res.headersSent) {
        return;
    }
    if (!req.path.match(/\.[^/.]+$/)) {
        res.status(404).json({
            success: false,
            message: 'API route not found.',
            path: req.path
        });
    } else {
        res.status(404).send('File not found');
    }
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
    console.log(`Website accessible at: http://localhost:${PORT}/${STUDENT_ID}/`);
    console.log(`API endpoints available at: http://localhost:${PORT}/${STUDENT_ID}/...`);
});