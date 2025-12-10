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

// Validate phone number
function isValidPhoneNumber(phone) {
    // Remove any spaces, dashes, or parentheses
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Check format: starts with +, has 1-4 digits for country code, then exactly 8 digits
    const phoneRegex = /^\+[0-9]{1,4}[0-9]{8}$/;
    return phoneRegex.test(cleanPhone);
}

// Post route for registering a new user
app.post(`/${STUDENT_ID}/users`, async (req, res) => {
    try {
        const { username, email, phone, dob, password } = req.body;
        
        // Validate required fields
        if (!username || !email || !phone || !dob || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields (username, email, phone, dob, password) are required.'
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
        
        // CHANGED: Validate phone number format (country code + 8 digits)
        if (!isValidPhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Required format: country code + 8 digits (e.g., +97112345678).'
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
            phone: phone,
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
app.post(`/${STUDENT_ID}/contents`, upload.single('file'), async (req, res) => {
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
        
        // Build file URL if file was uploaded
        let fileUrl = null;
        let fileName = null;
        let fileSize = null;
        
        if (req.file) {
            // File was uploaded successfully
            fileUrl = `/assets/uploads/${req.file.filename}`;
            fileName = req.file.originalname;
            fileSize = req.file.size;
        }
        
        // Create new content object with file information
        const newContent = {
            title: title,
            description: description || '',
            code: code,
            programmingLanguage: programmingLanguage,
            author: req.session.username,
            authorId: new ObjectId(req.session.userId),
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            createdAt: new Date()
        };
        
        // Insert content into database
        const result = await contentsCollection.insertOne(newContent);
        
        res.status(201).json({
            success: true,
            message: 'Content created successfully.',
            contentId: result.insertedId,
            title: title,
            author: req.session.username,
            fileUploaded: !!fileUrl,
            fileUrl: fileUrl
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
        const searchQuery = (req.query.q || '').trim();
        const languageFilter = (req.query.language || '').trim();

        // Get database instance
        const db = getDB();
        const contentsCollection = db.collection('contents');

        // Build query parts
        const queryParts = [];

        if (searchQuery) {
            queryParts.push({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { programmingLanguage: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }

        if (languageFilter) {
            // Escape regex special chars and match language exactly (case-insensitive)
            const escapedLanguage = languageFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            queryParts.push({ programmingLanguage: { $regex: `^${escapedLanguage}$`, $options: 'i' } });
        }

        const mongoQuery = queryParts.length > 0 ? { $and: queryParts } : {};

        // Search for contents matching filters
        const contents = await contentsCollection.find(mongoQuery)
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            message: 'Content search completed successfully.',
            searchQuery: searchQuery,
            language: languageFilter,
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

/**
 * NEW: Get route to serve uploaded files
 * This ensures files are accessible
 */
app.use('/assets/uploads', express.static(path.join(__dirname, 'public', 'assets', 'uploads')));

// NEW: Post route for uploading profile image
app.post(`/${STUDENT_ID}/upload/profile-picture`, upload.single('profilePicture'), async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to upload profile picture.'
            });
        }
        
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }
        
        // Validate file is an image
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'Only image files are allowed for profile pictures.'
            });
        }
        
        // Get database instance
        const db = getDB();
        const usersCollection = db.collection('users');
        
        // Build profile picture URL
        const profilePictureUrl = `/assets/uploads/${req.file.filename}`;
        
        // Update user's profile picture in database
        await usersCollection.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { 
                $set: { 
                    profilePicture: profilePictureUrl,
                    profilePictureUpdatedAt: new Date()
                } 
            }
        );
        
        res.json({
            success: true,
            message: 'Profile picture uploaded successfully.',
            profilePictureUrl: profilePictureUrl
        });
        
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during profile picture upload.'
        });
    }
});

/**
 * Post route to create a comment on a post
 * POST /M01039337/posts/:postId/comments
 */
app.post(`/${STUDENT_ID}/posts/:postId/comments`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to add comments.'
            });
        }

        const { postId } = req.params;
        const { text } = req.body;

        // Validate required fields
        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required.'
            });
        }

        // Get database instance
        const db = getDB();
        const commentsCollection = db.collection('comments');
        const contentsCollection = db.collection('contents');

        // Check if post exists
        const post = await contentsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        // Create comment
        const comment = {
            postId: new ObjectId(postId),
            author: req.session.username,
            userId: new ObjectId(req.session.userId),
            text: text.trim(),
            createdAt: new Date()
        };

        const result = await commentsCollection.insertOne(comment);

        res.status(201).json({
            success: true,
            message: 'Comment added successfully.',
            comment: {
                _id: result.insertedId,
                ...comment
            }
        });

    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while adding comment.'
        });
    }
});

/**
 * Get route to retrieve comments for a post
 * GET /M01039337/posts/:postId/comments
 */
app.get(`/${STUDENT_ID}/posts/:postId/comments`, async (req, res) => {
    try {
        const { postId } = req.params;

        // Get database instance
        const db = getDB();
        const commentsCollection = db.collection('comments');

        // Get all comments for post
        const comments = await commentsCollection.find({
            postId: new ObjectId(postId)
        }).sort({ createdAt: -1 }).toArray();

        res.json({
            success: true,
            postId: postId,
            count: comments.length,
            comments: comments
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving comments.'
        });
    }
});

/**
 * Delete route to remove a comment
 * DELETE /M01039337/comments/:commentId
 */
app.delete(`/${STUDENT_ID}/comments/:commentId`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to delete comments.'
            });
        }

        const { commentId } = req.params;

        // Get database instance
        const db = getDB();
        const commentsCollection = db.collection('comments');

        // Find comment
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        // Check if user is comment author
        if (comment.author !== req.session.username) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own comments.'
            });
        }

        // Delete comment
        await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });

        res.json({
            success: true,
            message: 'Comment deleted successfully.'
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting comment.'
        });
    }
});

/**
 * Post route to like/unlike a post
 * POST /M01039337/posts/:postId/like
 */
app.post(`/${STUDENT_ID}/posts/:postId/like`, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to like posts.'
            });
        }

        const { postId } = req.params;
        const { isLike } = req.body; // true for like, false for dislike

        // Get database instance
        const db = getDB();
        const likesCollection = db.collection('likes');
        const contentsCollection = db.collection('contents');

        // Check if post exists
        const post = await contentsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        // Check if user already liked/disliked this post
        const existingLike = await likesCollection.findOne({
            postId: new ObjectId(postId),
            user: req.session.username
        });

        if (existingLike) {
            // Update existing like/dislike
            if (existingLike.isLike === isLike) {
                // Same type, remove it (unlike/undislike)
                await likesCollection.deleteOne({ _id: existingLike._id });
                return res.json({
                    success: true,
                    message: isLike ? 'Like removed.' : 'Dislike removed.',
                    action: 'removed',
                    isLike: isLike
                });
            } else {
                // Different type, update it
                await likesCollection.updateOne(
                    { _id: existingLike._id },
                    { $set: { isLike: isLike, updatedAt: new Date() } }
                );
                return res.json({
                    success: true,
                    message: isLike ? 'Changed to like.' : 'Changed to dislike.',
                    action: 'updated',
                    isLike: isLike
                });
            }
        }

        // Create new like/dislike
        const likeRecord = {
            postId: new ObjectId(postId),
            user: req.session.username,
            userId: new ObjectId(req.session.userId),
            isLike: isLike,
            createdAt: new Date()
        };

        await likesCollection.insertOne(likeRecord);

        res.status(201).json({
            success: true,
            message: isLike ? 'Post liked.' : 'Post disliked.',
            action: 'created',
            isLike: isLike
        });

    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while liking post.'
        });
    }
});

/**
 * Get route to retrieve like/dislike statistics for a post
 * GET /M01039337/posts/:postId/likes
 */
app.get(`/${STUDENT_ID}/posts/:postId/likes`, async (req, res) => {
    try {
        const { postId } = req.params;

        // Get database instance
        const db = getDB();
        const likesCollection = db.collection('likes');

        // Get all likes and dislikes for post
        const likes = await likesCollection.find({
            postId: new ObjectId(postId)
        }).toArray();

        // Count likes and dislikes
        const likeCount = likes.filter(l => l.isLike).length;
        const dislikeCount = likes.filter(l => !l.isLike).length;

        // Check if current user has liked or disliked (if logged in)
        let userVote = null;
        if (req.session.username) {
            const userVote_record = likes.find(l => l.user === req.session.username);
            if (userVote_record) {
                userVote = userVote_record.isLike ? 'like' : 'dislike';
            }
        }

        res.json({
            success: true,
            postId: postId,
            likeCount: likeCount,
            dislikeCount: dislikeCount,
            userVote: userVote
        });

    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving likes.'
        });
    }
});

/**
 * Fetch trending code from GitHub Gists
 * GET /M01039337/trending-gists
 */
app.get(`/${STUDENT_ID}/trending-gists`, async (req, res) => {
    try {
        const language = req.query.language || 'javascript';
        
        // Import fetch if not already available (Node.js 18+)
        const fetch = (await import('node-fetch')).default;
        
        // Fetch public gists from GitHub API
        const response = await fetch('https://api.github.com/gists/public', {
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'CodeLogs-App' // GitHub requires a User-Agent header
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API returned status ${response.status}`);
        }
        
        const gists = await response.json();
        
        // Filter gists by programming language and limit to 6 results
        const filteredGists = gists
            .filter(gist => {
                // Check if any file in the gist matches the language
                const files = Object.values(gist.files);
                return files.some(file => 
                    file.language && 
                    file.language.toLowerCase() === language.toLowerCase()
                );
            })
            .slice(0, 6) // Limit to 6 gists
            .map(gist => ({
                id: gist.id,
                description: gist.description || 'No description provided',
                url: gist.html_url,
                author: gist.owner.login,
                authorUrl: gist.owner.html_url,
                authorAvatar: gist.owner.avatar_url,
                files: Object.keys(gist.files),
                fileCount: Object.keys(gist.files).length,
                createdAt: gist.created_at,
                updatedAt: gist.updated_at
            }));
        
        res.json({
            success: true,
            message: 'Trending gists retrieved successfully from GitHub.',
            language: language,
            count: filteredGists.length,
            source: 'GitHub Gists API',
            gists: filteredGists
        });
        
    } catch (error) {
        console.error('GitHub Gists API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending gists from GitHub.',
            error: error.message
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