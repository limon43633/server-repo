import express from 'express';
import { getDB } from '../db/connectDB.js';

const router = express.Router();

// POST - Create new user
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    
    const { uid, email, name, photoURL, role, status } = req.body;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ uid });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const newUser = {
      uid,
      email,
      name,
      photoURL,
      role: role || 'buyer',
      status: status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { ...newUser, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// GET - Get user by UID
router.get('/:uid', async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    const { uid } = req.params;

    const user = await usersCollection.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

export default router;