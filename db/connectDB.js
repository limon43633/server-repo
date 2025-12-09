const { MongoClient } = require('mongodb');
let db;

const connectToDatabase = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const client = new MongoClient(uri);
        
        await client.connect();
        db = client.db('garments-tracker');
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getDatabase = () => db;

module.exports = { connectToDatabase, getDatabase };