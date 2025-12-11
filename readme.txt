PREREQUISITES:
- Node.js (version 20.19.6 or higher)
- MongoDB (running locally on port 27017)

INSTALLATION:
1. Navigate to the project directory
2. Install dependencies by running:
   npm install

SETUP:
1. Ensure MongoDB is running locally
2. The database will be automatically set up and populated when you start the server

TO RUN THE SERVER:
1. Use the following command to set up the database and start the server:
   npm start

   OR manually run:
   - Setup database: npm run setup_db
   - Start server: node server.js

2. The server will run on http://localhost:8080/M01039337/

FEATURES:
- User authentication (registration and login with bcrypt password hashing)
- Blog content management with file uploads
- User profiles and follow functionality
- Comments on blog posts
- Search functionality
- Challenge system
- Account recovery

PROJECT STRUCTURE:
- server.js: Main Express server and API routes
- connect_db.js: MongoDB connection configuration
- setup_db.js: Database initialization and indexing
- public/: Frontend files (HTML, CSS, JavaScript)
- db_dump/: Database backup files for import 