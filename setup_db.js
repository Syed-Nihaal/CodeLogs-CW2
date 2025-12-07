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
        await contentsCollection.createIndex({ title: 'text', description: 'text', language: 'text' });
        console.log('Contents collection indexes created');
        
        // Set follows collection index
        const followsCollection = db.collection('follows');
        await followsCollection.createIndex({ follower: 1, following: 1 }, { unique: true });
        await followsCollection.createIndex({ follower: 1 });
        await followsCollection.createIndex({ following: 1 });
        await followsCollection.createIndex({ createdAt: -1 });
        console.log('Follows collection indexes created');
        
        // Display statistics
        console.log('Database Setup Complete');
        console.log(`Database: ${DB_NAME}`);
        console.log(`Users: ${await usersCollection.countDocuments()}`);
        console.log(`Contents: ${await contentsCollection.countDocuments()}`);
        console.log(`Follows: ${await followsCollection.countDocuments()}`);
        
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