// server/routes/orders.js - UPDATED VERSION
import express from 'express';
import { getDB } from '../db/connectDB.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// POST - Create new order (FIXED FOR BOOKING PAGE)
router.post('/', async (req, res) => {
  try {
    console.log('📦 Received order creation request:', req.body);
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    const orderData = req.body;

    // Validate required fields
    const requiredFields = ['userId', 'productId', 'orderQuantity', 'totalPrice', 'buyerEmail', 'buyerName'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate product exists
    let product;
    try {
      product = await productsCollection.findOne({ 
        _id: new ObjectId(orderData.productId) 
      });
    } catch (error) {
      console.log('Product ID format error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate quantity
    const orderQuantity = parseInt(orderData.orderQuantity || orderData.quantity);
    if (isNaN(orderQuantity) || orderQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order quantity'
      });
    }

    if (product.availableQuantity < orderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient product quantity. Available: ${product.availableQuantity}, Requested: ${orderQuantity}`
      });
    }

    if (orderQuantity < (product.minimumOrderQuantity || 1)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.minimumOrderQuantity || 1}`
      });
    }

    // Create order object with all required fields
    const newOrder = {
      userId: orderData.userId,
      userEmail: orderData.userEmail || orderData.buyerEmail,
      userName: orderData.userName || orderData.buyerName,
      productId: new ObjectId(orderData.productId),
      productName: orderData.productName || product.name || product.title,
      productImage: orderData.productImage || product.images?.[0] || product.image || '',
      productPrice: parseFloat(orderData.productPrice || product.price),
      quantity: orderQuantity,
      totalPrice: parseFloat(orderData.totalPrice || (product.price * orderQuantity)),
      contactNumber: orderData.contactNumber || '',
      deliveryAddress: orderData.deliveryAddress || '',
      additionalNotes: orderData.additionalNotes || '',
      paymentMethod: orderData.paymentMethod || orderData.paymentOption || 'Cash on Delivery',
      status: 'pending',
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      // For easy querying
      buyerEmail: orderData.buyerEmail || orderData.userEmail,
      buyerName: orderData.buyerName || orderData.userName,
      productCategory: product.category,
      // For tracking
      trackingUpdates: [
        {
          status: 'ordered',
          date: new Date(),
          location: 'Online Store',
          notes: 'Order placed successfully'
        }
      ]
    };

    console.log('📝 Creating order:', newOrder);

    // Insert order
    const result = await ordersCollection.insertOne(newOrder);

    // Update product quantity
    await productsCollection.updateOne(
      { _id: new ObjectId(orderData.productId) },
      { $inc: { availableQuantity: -orderQuantity } }
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        _id: result.insertedId,
        ...newOrder,
        productId: orderData.productId // Keep original for client
      }
    });

    console.log('✅ Order created successfully, ID:', result.insertedId);

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET - Get user's orders (FIXED FOR MY ORDERS PAGE)
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('📋 Fetching orders for user:', req.params.userId);
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { userId } = req.params;

    // Try multiple query patterns
    let query = { userId };
    
    // If query returns no results, try by email
    let orders = await ordersCollection
      .find(query)
      .sort({ orderDate: -1 })
      .toArray();

    console.log(`📊 Found ${orders.length} orders for user ${userId}`);

    // If no orders found, try searching by email
    if (orders.length === 0 && req.query.email) {
      console.log('🔍 Trying to find orders by email:', req.query.email);
      orders = await ordersCollection
        .find({ userEmail: req.query.email })
        .sort({ orderDate: -1 })
        .toArray();
      console.log(`📊 Found ${orders.length} orders by email`);
    }

    // Format response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      productName: order.productName,
      productImage: order.productImage,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      orderDate: order.orderDate,
      status: order.status,
      paymentMethod: order.paymentMethod,
      deliveryAddress: order.deliveryAddress,
      additionalNotes: order.additionalNotes,
      trackingUpdates: order.trackingUpdates || [],
      // For backward compatibility
      orderQuantity: order.quantity,
      orderPrice: order.totalPrice
    }));

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
    });

  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET - Get user's orders by email (NEW ENDPOINT)
router.get('/email/:email', async (req, res) => {
  try {
    console.log('📧 Fetching orders for email:', req.params.email);
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { email } = req.params;

    const orders = await ordersCollection
      .find({ 
        $or: [
          { userEmail: email },
          { buyerEmail: email }
        ]
      })
      .sort({ orderDate: -1 })
      .toArray();

    console.log(`📊 Found ${orders.length} orders for email ${email}`);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('❌ Error fetching orders by email:', error);
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

    const { status, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by product name or order ID
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { buyerName: { $regex: search, $options: 'i' } },
        { buyerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      ordersCollection
        .find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      ordersCollection.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
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
    const { status, notes, location } = req.body;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const validStatuses = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add tracking update if provided
    if (notes || location) {
      const trackingUpdate = {
        status,
        date: new Date(),
        location: location || 'Unknown',
        notes: notes || ''
      };

      updateData.$push = { trackingUpdates: trackingUpdate };
    }

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
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

// PATCH - Cancel order
router.patch('/:orderId/cancel', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // Get order details
    const order = await ordersCollection.findOne({ 
      _id: new ObjectId(orderId) 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // Restore product quantity
    await productsCollection.updateOne(
      { _id: order.productId },
      { $inc: { availableQuantity: order.quantity } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// GET - Get pending orders (for manager)
router.get('/pending/all', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');

    const orders = await ordersCollection
      .find({ status: 'pending' })
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
      message: 'Failed to fetch pending orders',
      error: error.message
    });
  }
});

// GET - Get approved orders (for manager)
router.get('/approved/all', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');

    const orders = await ordersCollection
      .find({ status: { $in: ['approved', 'processing', 'shipped'] } })
      .sort({ updatedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved orders',
      error: error.message
    });
  }
});

// POST - Add tracking update
router.post('/:orderId/tracking', async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection('orders');
    const { orderId } = req.params;
    const { status, notes, location } = req.body;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const trackingUpdate = {
      status,
      date: new Date(),
      location: location || 'Factory',
      notes: notes || ''
    };

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        },
        $push: { trackingUpdates: trackingUpdate }
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
      message: 'Tracking updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update tracking',
      error: error.message
    });
  }
});

export default router;