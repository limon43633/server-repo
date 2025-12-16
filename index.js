import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDB.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js'; // Add this

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes); // Add this

// Health check is ok
app.get('/', (req, res) => {
  res.send('✅ Garments Tracker Server is Running!');
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();