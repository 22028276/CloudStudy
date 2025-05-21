const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt for username:', username);
      
      if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ 
          success: false,
          message: 'Username and password are required' 
        });
      }

      // Find user - username is already lowercase in the model
      const user = await User.findOne({ username: username.toLowerCase() });
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Check password
      console.log('Checking password...');
      const isMatch = await user.comparePassword(password);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('Password does not match');
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Generate token
      const token = generateToken(user._id);
      console.log('Token generated successfully');

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            username: user.username
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async register(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long'
        });
      }

      // Check if username exists - username is already lowercase in the model
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Create new user
      const user = new User({
        username,
        password
      });

      const savedUser = await user.save();

      // Generate token
      const token = generateToken(savedUser._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: savedUser._id,
            username: savedUser.username
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Confirm registration
  async confirmRegistration(req, res) {
    try {
      const { username, code } = req.body;
      
      // Giả lập xác nhận thành công
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Confirmation error:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new AuthController(); 