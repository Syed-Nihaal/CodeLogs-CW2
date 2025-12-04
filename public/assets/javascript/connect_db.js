// Importing MongoDB client
import { MongoClient } from 'mongodb';

// MongoDB connection URL and database name
const URL = 'mongodb://localhost:27017';
const DB_NAME = 'codelogs_db';

// Creating MongoDB client instance
const client = new MongoClient(URL);

// Variable to store database connection
let db = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<Db>} Database instance
 */
export async function connectDB() {
    try {
        if (!db) {
            // Connect to MongoDB server
            await client.connect();
            console.log('Successfully connected to MongoDB');
            
            // Get database instance
            db = client.db(DB_NAME);
        }
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Get database instance
 * @returns {Db} Database instance
 */
export function getDB() {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
}

/**
 * Close database connection
 */
export async function closeDB() {
    try {
        if (client) {
            await client.close();
            db = null;
            console.log('MongoDB connection closed');
        }
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
    }
}