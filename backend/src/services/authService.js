const jwt = require('jsonwebtoken');

// Mock users database
const users = [
    {
        id: '1',
        username: 'test',
        password: 'test123',
        email: 'test@example.com'
    }
];

// JWT secret key
const JWT_SECRET = 'your-secret-key';

class AuthService {
    async login(username, password) {
        // Tìm user
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Tạo JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };
    }

    async register(username, password, email) {
        // Kiểm tra user đã tồn tại
        if (users.find(u => u.username === username)) {
            throw new Error('Username already exists');
        }

        // Tạo user mới
        const newUser = {
            id: String(users.length + 1),
            username,
            password,
            email
        };

        users.push(newUser);

        // Tạo token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                username: newUser.username,
                email: newUser.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            message: 'Registration successful',
            token: token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService(); 