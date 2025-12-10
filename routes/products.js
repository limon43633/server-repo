import express from 'express';
import { getDB } from '../db/connectDB.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET - Home page products (limit 6, showOnHome: true)
router.get('/home', async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection('products');
    
    const { sort = 'latest' } = req.query;
    
    // Sorting logic
    let sortOption = {};
    if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    }
    
    const products = await productsCollection
      .find({ showOnHome: true })
      .sort(sortOption)
      .limit(6)
      .toArray();
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// GET - All products (for All Products page)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).toArray();
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// GET - Single product by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection('products');
    const { id } = req.params;
    
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

export default router;