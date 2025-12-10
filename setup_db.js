// Import module
import { MongoClient } from 'mongodb';

// MongoDB connection URL and database name
const URL = 'mongodb://localhost:27017';
const DB_NAME = 'codelogs_db';

// Function to set up the database
async function setupDatabase() {
    const client = new MongoClient(URL);
    
    try {
        // Connect to MongoDB
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        
        // Set user collection index
        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ createdAt: -1 });
        console.log('Users collection indexes created');
        
        // Set contents collection index
        const contentsCollection = db.collection('contents');
        await contentsCollection.createIndex({ author: 1 });
        await contentsCollection.createIndex({ authorId: 1 });
        await contentsCollection.createIndex({ createdAt: -1 });
        
        // Drop old text indexes if they exist
        try {
            await contentsCollection.dropIndex('title_text_description_text');
        } catch (e) {
            // Index doesn't exist, that's fine
        }
        try {
            await contentsCollection.dropIndex('title_text_description_text_language_text');
        } catch (e) {
            // Index doesn't exist, that's fine
        }
        
        // Create text index on title and description only
        await contentsCollection.createIndex({ title: 'text', description: 'text' });
        // Add regular index for programmingLanguage field
        await contentsCollection.createIndex({ programmingLanguage: 1 });
        console.log('Contents collection indexes created');
        
        // Set follows collection index
        const followsCollection = db.collection('follows');
        await followsCollection.createIndex({ follower: 1, following: 1 }, { unique: true });
        await followsCollection.createIndex({ follower: 1 });
        await followsCollection.createIndex({ following: 1 });
        await followsCollection.createIndex({ createdAt: -1 });
        console.log('Follows collection indexes created');
        
        // Set comments collection index
        const commentsCollection = db.collection('comments');
        await commentsCollection.createIndex({ postId: 1 });
        await commentsCollection.createIndex({ author: 1 });
        await commentsCollection.createIndex({ createdAt: -1 });
        console.log('Comments collection indexes created');
        
        // Set likes collection index
        const likesCollection = db.collection('likes');
        await likesCollection.createIndex({ postId: 1, user: 1 }, { unique: true });
        await likesCollection.createIndex({ postId: 1 });
        await likesCollection.createIndex({ user: 1 });
        console.log('Likes collection indexes created');
        
        // Display statistics
        console.log('Database Setup Complete');
        console.log(`Database: ${DB_NAME}`);
        console.log(`Users: ${await usersCollection.countDocuments()}`);
        console.log(`Contents: ${await contentsCollection.countDocuments()}`);
        console.log(`Follows: ${await followsCollection.countDocuments()}`);
        console.log(`Comments: ${await commentsCollection.countDocuments()}`);
        console.log(`Likes: ${await likesCollection.countDocuments()}`);
        
        // Display indexes
        console.log('Indexes Created');
        console.log('Users indexes:', await usersCollection.indexes());
        console.log('Contents indexes:', await contentsCollection.indexes());
        console.log('Follows indexes:', await followsCollection.indexes());
                
    } catch (error) {
        console.error('Error during database setup:', error);
        throw error;
    } finally {
        // Close connection
        await client.close();
        console.log('\n Database connection closed');
    }
}

// Run setup
setupDatabase()
    .then(() => {
        console.log('\nYou can now start your server with: node server.js');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nDatabase setup failed:', error);
        process.exit(1);
    });