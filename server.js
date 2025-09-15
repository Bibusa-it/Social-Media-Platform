const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./social_media.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Likes table
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(post_id, user_id)
  )`);

  // Followers table
  db.run(`CREATE TABLE IF NOT EXISTS followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users (id),
    FOREIGN KEY (following_id) REFERENCES users (id),
    UNIQUE(follower_id, following_id)
  )`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.status(201).json({ 
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, email, full_name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Login failed' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ 
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        full_name: user.full_name,
        bio: user.bio,
        profile_picture: user.profile_picture
      }
    });
  });
});

// Get user profile
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  
  db.get(`
    SELECT 
      u.id, u.username, u.full_name, u.bio, u.profile_picture, u.created_at,
      (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
      (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
      EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM users u WHERE u.id = ?
  `, [req.user.id, userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Update user profile
app.put('/api/users/profile', authenticateToken, upload.single('profile_picture'), (req, res) => {
  console.log('Profile update request received:', { body: req.body, file: req.file });
  const { full_name, bio } = req.body;
  const profile_picture = req.file ? `/uploads/${req.file.filename}` : null;
  
  let query = 'UPDATE users SET full_name = ?, bio = ?';
  let params = [full_name, bio];
  
  if (profile_picture) {
    query += ', profile_picture = ?';
    params.push(profile_picture);
  }
  
  query += ' WHERE id = ?';
  params.push(req.user.id);
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  });
});

// Create post
app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
  const { content } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  db.run(
    'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
    [req.user.id, content, image_url],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create post' });
      }
      
      res.status(201).json({ 
        message: 'Post created successfully',
        post_id: this.lastID
      });
    }
  );
});

// Get all posts (feed)
app.get('/api/posts', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  db.all(`
    SELECT 
      p.*,
      u.username, u.full_name, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, limit, offset], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    
    res.json(posts);
  });
});

// Get user posts
app.get('/api/users/:id/posts', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  db.all(`
    SELECT 
      p.*,
      u.username, u.full_name, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, userId, limit, offset], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user posts' });
    }
    
    res.json(posts);
  });
});

// Like/Unlike post
app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
  const postId = req.params.id;
  
  db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id], (err, like) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to process like' });
    }
    
    if (like) {
      // Unlike
      db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to unlike post' });
        }
        res.json({ message: 'Post unliked', liked: false });
      });
    } else {
      // Like
      db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to like post' });
        }
        res.json({ message: 'Post liked', liked: true });
      });
    }
  });
});

// Add comment
app.post('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }
  
  db.run(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [postId, req.user.id, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add comment' });
      }
      
      res.status(201).json({ 
        message: 'Comment added successfully',
        comment_id: this.lastID
      });
    }
  );
});

// Get post comments
app.get('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const postId = req.params.id;
  
  db.all(`
    SELECT 
      c.*,
      u.username, u.full_name, u.profile_picture
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `, [postId], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
    
    res.json(comments);
  });
});

// Delete post
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;
  
  // First check if the post belongs to the current user
  db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Delete the post (cascade will handle likes and comments)
    db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete post' });
      }
      
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Follow/Unfollow user
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
  const userIdToFollow = req.params.id;
  
  if (req.user.id == userIdToFollow) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  db.get('SELECT * FROM followers WHERE follower_id = ? AND following_id = ?', [req.user.id, userIdToFollow], (err, follow) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to process follow' });
    }
    
    if (follow) {
      // Unfollow
      db.run('DELETE FROM followers WHERE follower_id = ? AND following_id = ?', [req.user.id, userIdToFollow], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to unfollow user' });
        }
        res.json({ message: 'User unfollowed', following: false });
      });
    } else {
      // Follow
      db.run('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)', [req.user.id, userIdToFollow], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to follow user' });
        }
        res.json({ message: 'User followed', following: true });
      });
    }
  });
});

// Get user's followers
app.get('/api/users/:id/followers', authenticateToken, (req, res) => {
  const userId = req.params.id;
  
  db.all(`
    SELECT 
      u.id, u.username, u.full_name, u.profile_picture,
      EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM followers f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `, [req.user.id, userId], (err, followers) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch followers' });
    }
    
    res.json(followers);
  });
});

// Get user's following
app.get('/api/users/:id/following', authenticateToken, (req, res) => {
  const userId = req.params.id;
  
  db.all(`
    SELECT 
      u.id, u.username, u.full_name, u.profile_picture,
      EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM followers f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `, [req.user.id, userId], (err, following) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch following' });
    }
    
    res.json(following);
  });
});

// Get suggested users (users not followed by current user)
app.get('/api/users/suggested', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      u.id, u.username, u.full_name, u.profile_picture,
      EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM users u
    WHERE u.id != ? AND u.id NOT IN (
      SELECT following_id FROM followers WHERE follower_id = ?
    )
    ORDER BY RANDOM()
    LIMIT 5
  `, [req.user.id, req.user.id, req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch suggested users' });
    }
    
    res.json(users);
  });
});

// Delete user account
app.delete('/api/users/account', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Delete user's data in the correct order (respecting foreign key constraints)
  db.serialize(() => {
    // Delete user's likes
    db.run('DELETE FROM likes WHERE user_id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user likes' });
      }
    });
    
    // Delete user's comments
    db.run('DELETE FROM comments WHERE user_id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user comments' });
      }
    });
    
    // Delete user's posts
    db.run('DELETE FROM posts WHERE user_id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user posts' });
      }
    });
    
    // Delete user's followers (both as follower and following)
    db.run('DELETE FROM followers WHERE follower_id = ? OR following_id = ?', [userId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user followers' });
      }
    });
    
    // Finally delete the user
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user account' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    });
  });
});

// Search users
app.get('/api/users/search/:query', authenticateToken, (req, res) => {
  const query = req.params.query;
  
  db.all(`
    SELECT 
      u.id, u.username, u.full_name, u.profile_picture,
      EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
    FROM users u
    WHERE u.username LIKE ? OR u.full_name LIKE ?
    ORDER BY u.username
    LIMIT 20
  `, [req.user.id, `%${query}%`, `%${query}%`], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to search users' });
    }
    
    res.json(users);
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Social Media Platform server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});

