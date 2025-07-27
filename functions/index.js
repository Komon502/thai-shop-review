const functions = require("firebase-functions");
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Firebase ไม่รองรับการเขียนไฟล์บน disk โดยตรงใน production
// ดังนั้น /uploads จะไม่ทำงาน → ควรเปลี่ยนไปใช้ Firebase Storage ในอนาคต
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL config (ใช้ของคุณเองตาม local หรือ server จริง)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "thai_shop_review",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Multer (แต่จะใช้ไม่ได้ถ้า deploy Firebase จริง ต้องเปลี่ยนวิธี)
const storage = multer.memoryStorage(); // ใช้ memory แทน disk
const upload = multer({ storage });

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ----------------- ROUTES -----------------

app.post("/api/register", (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) return res.status(400).json({ error: "User already exists" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
        [email, hashedPassword, username],
        (err, result) => {
          if (err) return res.status(500).json({ error: "Failed to create user" });

          const token = jwt.sign(
            { userId: result.insertId, email },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
          );

          res.status(201).json({
            message: "User created successfully",
            token,
            user: { id: result.insertId, email, username },
          });
        }
      );
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile_image: user.profile_image,
      },
    });
  });
});

app.get("/api/posts", (req, res) => {
  db.query("SELECT * FROM posts_with_ratings ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.post("/api/posts", authenticateToken, upload.single("image"), (req, res) => {
  const { shop_name, description, latitude, longitude, address } = req.body;
  const image_url = null; // ต้องเปลี่ยนให้ใช้งาน Firebase Storage หรือ Cloudinary แทน

  db.query(
    "INSERT INTO posts (user_id, shop_name, description, latitude, longitude, address, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [req.user.userId, shop_name, description, latitude, longitude, address, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create post" });
      res.status(201).json({
        message: "Post created successfully",
        postId: result.insertId,
      });
    }
  );
});

app.get("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;

  db.query(
    `SELECT c.*, u.username, u.profile_image 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.post_id = ? 
     ORDER BY c.created_at ASC`,
    [postId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(results);
    }
  );
});

app.post("/api/posts/:postId/comments", authenticateToken, (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;

  db.query(
    "INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
    [postId, req.user.userId, comment],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to add comment" });
      res.status(201).json({
        message: "Comment added successfully",
        commentId: result.insertId,
      });
    }
  );
});

app.get("/api/posts/:postId/user-rating", authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  db.query(
    "SELECT rating FROM ratings WHERE post_id = ? AND user_id = ?",
    [postId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const userRating = results.length > 0 ? results[0].rating : 0;
      res.json({ rating: userRating });
    }
  );
});

app.get("/api/profile", authenticateToken, (req, res) => {
  db.query(
    "SELECT id, email, username, profile_image FROM users WHERE id = ?",
    [req.user.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(results[0]);
    }
  );
});

app.put("/api/profile", authenticateToken, upload.single("profile_image"), (req, res) => {
  const { username } = req.body;
  const profile_image = null; // ปรับให้ใช้ storage ในอนาคต

  let query = "UPDATE users SET username = ?";
  const params = [username];

  if (profile_image) {
    query += ", profile_image = ?";
    params.push(profile_image);
  }

  query += " WHERE id = ?";
  params.push(req.user.userId);

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to update profile" });
    res.json({ message: "Profile updated successfully" });
  });
});

// ✅ Export ให้ Firebase ใช้งาน
exports.api = functions.https.onRequest(app);
