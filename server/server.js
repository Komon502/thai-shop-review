const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ใส่รหัสผ่าน MySQL ของคุณ
    database: 'thai_shop_review'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // Check if user exists
        db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user
            db.query(
                'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
                [email, hashedPassword, username],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Failed to create user' });
                    
                    const token = jwt.sign(
                        { userId: result.insertId, email: email },
                        process.env.JWT_SECRET || 'your-secret-key',
                        { expiresIn: '24h' }
                    );
                    
                    res.status(201).json({ 
                        message: 'User created successfully',
                        token: token,
                        user: { id: result.insertId, email: email, username: username }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            if (results.length === 0) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }
            
            const user = results[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }
            
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                message: 'Login successful',
                token: token,
                user: { 
                    id: user.id, 
                    email: user.email, 
                    username: user.username,
                    profile_image: user.profile_image
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Posts Routes
app.get('/api/posts', (req, res) => {
    db.query('SELECT * FROM posts_with_ratings ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const { shop_name, description, latitude, longitude, address } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        db.query(
            'INSERT INTO posts (user_id, shop_name, description, latitude, longitude, address, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, shop_name, description, latitude, longitude, address, image_url],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Failed to create post' });
                
                res.status(201).json({
                    message: 'Post created successfully',
                    postId: result.insertId
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Comments Routes
app.get('/api/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;
    
    db.query(`
        SELECT c.*, u.username, u.profile_image 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.post_id = ? 
        ORDER BY c.created_at ASC
    `, [postId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

app.post('/api/posts/:postId/comments', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;
    
    db.query(
        'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)',
        [postId, req.user.userId, comment],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to add comment' });
            
            res.status(201).json({
                message: 'Comment added successfully',
                commentId: result.insertId
            });
        }
    );
});

// Ratings Routes
app.post('/api/posts/:postId/rating', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { rating } = req.body;
    
    // Insert or update rating
    db.query(
        'INSERT INTO ratings (post_id, user_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?',
        [postId, req.user.userId, rating, rating],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to add rating' });
            
            res.json({ message: 'Rating added successfully' });
        }
    );
});

// Profile Routes
app.get('/api/profile', authenticateToken, (req, res) => {
    db.query('SELECT id, email, username, profile_image FROM users WHERE id = ?', [req.user.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(results[0]);
    });
});

app.put('/api/profile', authenticateToken, upload.single('profile_image'), (req, res) => {
    const { username } = req.body;
    const profile_image = req.file ? `/uploads/${req.file.filename}` : null;
    
    let query = 'UPDATE users SET username = ?';
    let params = [username];
    
    if (profile_image) {
        query += ', profile_image = ?';
        params.push(profile_image);
    }
    
    query += ' WHERE id = ?';
    params.push(req.user.userId);
    
    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to update profile' });
        
        res.json({ message: 'Profile updated successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});