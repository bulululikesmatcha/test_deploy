const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Journal = require('../models/Journal');
// Comment model removed as it's no longer needed
const { AdminAccount } = require('../models/AdminAccount');
const bcrypt = require('bcrypt');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalReports
    ] = await Promise.all([
      User.countDocuments(),
      Journal.countDocuments(),
      Journal.countDocuments({ status: 'reported' })
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalComments: 0, // Set to 0 since comment functionality is not used
      totalReports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const recentJournals = await Journal.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name');

    // No longer fetching comments as the model is removed
    const activities = recentJournals.map(journal => ({
      user: journal.userId?.name || 'Unknown User',
      action: 'Created a new journal',
      time: journal.createdAt,
      status: journal.status || 'published'
    })).sort((a, b) => b.time - a.time)
     .slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all journals
router.get('/journals', async (req, res) => {
  try {
    const journals = await Journal.find().populate('userId', 'name email');
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get journals by user
router.get('/journals/user/:userId', async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.params.userId })
      .populate('userId', 'name email');
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete journal
router.delete('/journals/:id', async (req, res) => {
  try {
    const journal = await Journal.findByIdAndDelete(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    res.json({ message: 'Journal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a user's role to admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(userId, { role: 'admin' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 