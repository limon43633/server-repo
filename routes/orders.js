import express from 'express';
import { getDB } from '../db/connectDB.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// POST - Create new order
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    const orderData = req.body;

    // Validate product availability
    const product = await productsCollection.findOne({ _id: new ObjectId(orderData.productId) });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.availableQuantity < orderData.orderQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient product quantity'
      });
    }

    // Create order
    const newOrder = {
      ...orderData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await ordersCollection.insertOne(newOrder);

    // Update product quantity (optional - you can do this after approval)
    // await productsCollection.updateOne(
    //   { _id: new ObjectId(orderData.productId) },
    //   { $inc: { availableQuantity: -orderData.orderQuantity } }
    // );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { ...newOrder, _id: result.insertedId }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// GET - Get user's orders
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { userId } = req.params;

    const orders = await ordersCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET - Get all orders (for admin/manager)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');

    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

export default router;