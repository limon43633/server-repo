const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectToDatabase } = require('./db/connectDB');
const productsRoutes = require('./routes/products');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://your-domain.com'], // Add your client URL
    credentials: true
}));
app.use(express.json());

// Database connection
connectToDatabase();

// Routes
app.use('/api/products', productsRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Garments Order Tracker Server is running...');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});