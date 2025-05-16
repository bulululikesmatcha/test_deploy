const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Journal = require('../models/Journal');
const JournalImages = require('../models/JournalImages');
const Sequence = require('../models/Sequence');
const { AdminAccount } = require('../models/AdminAccount');
const bcrypt = require('bcrypt');
const passport = require('../config/passport');

// Check if user email already exists
router.get('/check', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    const user = await User.findOne({ email });
    
    res.json({ exists: !!user });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ message: err.message });
  }
});

// Google OAuth Routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    // Create a user object to return that matches our regular login format
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    };
    
    // Redirect to frontend with user data
    res.redirect(`/login-success.html?user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

// Create user
router.post('/', async (req, res) => {
  try {
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    
    const sequenceDocument = await Sequence.findOneAndUpdate(
      { _id: 'userid' },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      _id: sequenceDocument.sequence_value,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Read all users
router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get user profile with recent activity
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get recent journals (last 5)
    const recentJournals = await Journal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);
      
    // Get recent image uploads (last 5)
    const recentImages = await JournalImages.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Combine and sort all activity by date
    const allActivity = [
      ...recentJournals.map(journal => ({
        type: 'journal',
        title: journal.title,
        id: journal._id,
        date: journal.createdAt
      })),
      ...recentImages.map(image => ({
        type: 'image',
        journalTitle: image.journalTitle,
        journalId: image.journalId,
        id: image._id,
        date: image.createdAt
      }))
    ];
    
    // Sort by date, newest first
    allActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Return user profile with activity
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt || new Date()
      },
      recentActivity: allActivity.slice(0, 10) // Limit to 10 most recent activities
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    console.log('Login attempt:', usernameOrEmail);
    
    // First check if this is an admin login
    const admin = await AdminAccount.findOne({ username: usernameOrEmail });
    
    if (admin) {
      console.log('Admin user found, verifying credentials...');
      // Compare admin passwords
      const isAdminMatch = await bcrypt.compare(password, admin.password);
      
      if (isAdminMatch) {
        console.log('Admin login successful');
        return res.status(200).json({ 
          message: 'Admin login successful',
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            isAdmin: true,
            sessionType: 'admin',
            sessionId: Date.now()
          }
        });
      } else {
        console.log('Invalid admin credentials');
        return res.status(400).json({ 
          message: 'Wrong password. Try again or click Forgot password to reset it', 
          errorType: 'invalid_password' 
        });
      }
    }

    // If not admin, try regular user login
    const user = await User.findOne({ 
      $or: [
        { email: usernameOrEmail },
        { name: usernameOrEmail }
      ]
    });

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ 
        message: 'The email or username you entered doesn\'t match any account', 
        errorType: 'user_not_found' 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid credentials');
      return res.status(400).json({ 
        message: 'Wrong password. Try again or click Forgot password to reset it', 
        errorType: 'invalid_password' 
      });
    }

    console.log('User login successful');
    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: false,
        sessionType: 'user',
        sessionId: Date.now()
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user password
router.post('/:userId/update-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Special case for admin override (only to be used from admin panel)
    const isAdminOverride = currentPassword === 'admin-override';
    
    if (!isAdminOverride) {
      // Regular password change - verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
