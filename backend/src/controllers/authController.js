const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId } = require('../config/aws');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const User = require('../models/User');

// Tài khoản test
const testUser = {
  username: 'test',
  password: 'test123',
  email: 'test@example.com'
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        });
      }

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        username: user.username,
        token
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async register(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        });
      }

      // Check if user already exists
      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create new user
      const user = await User.create({
        username,
        password
      });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        token
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
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