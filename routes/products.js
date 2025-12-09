const express = require('express');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../db/connectDB');
const router = express.Router();

// Get all products with pagination
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await db.collection('products')
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('products').countDocuments();

        res.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get products for homepage (limited to 6)
router.get('/homepage', async (req, res) => {
    try {
        const db = getDatabase();
        const products = await db.collection('products')
            .find({ showOnHome: true })
            .limit(6)
            .toArray();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const product = await db.collection('products').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new product (Manager only)
router.post('/', async (req, res) => {
    try {
        const db = getDatabase();
        const productData = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('products').insertOne(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { _id: result.insertedId, ...productData }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const result = await db.collection('products').deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;