const express = require('express')
const router =express.Router()
const User  = require('../models/User')

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const newUser = new User({ username, email, password });
    await newUser.save();
    const token = newUser.generateToken();
    res.status(201).json({
      token,
      user: { id: newUser._id, username, email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = user.generateToken();
    res.status(200).json({
      token: token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ valid: false, message: 'No token provided' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);   
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(400).json({ valid: false, message: 'User not found' });
    }

    res.status(200).json({
      valid: true,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(400).json({ valid: false, message: 'Invalid token' });
  }
});

module.exports = router;
