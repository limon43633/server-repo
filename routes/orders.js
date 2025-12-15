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

    // Validate product exists
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(orderData.productId) 
    });
    
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
      productImage: product.images[0],
      productCategory: product.category,
      status: 'pending',
      orderDate: new Date(),
      updatedAt: new Date()
    };

    const result = await ordersCollection.insertOne(newOrder);

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
      .sort({ orderDate: -1 })
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

// GET - Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await ordersCollection.findOne({ 
      _id: new ObjectId(orderId) 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
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
      .sort({ orderDate: -1 })
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

// PUT - Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const validStatuses = ['pending', 'approved', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

export default router;