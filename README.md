# SocialConnect - Modern Social Media Platform

A full-stack social media application built with modern web technologies. This project demonstrates advanced frontend and backend development skills with a focus on user experience and performance.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration and login system with JWT tokens
- **User Profiles**: Customizable profiles with bio, profile pictures, and statistics
- **Posts & Comments**: Create, view, and interact with posts and comments
- **Like System**: Like and unlike posts with real-time updates
- **Follow System**: Follow/unfollow users and view followers/following lists
- **Search Functionality**: Search for users by username or full name
- **Image Upload**: Upload images with posts and profile pictures
- **Responsive Design**: Mobile-first responsive design that works on all devices

### Advanced Features
- **Real-time Interactions**: Instant updates for likes, comments, and follows
- **Modern UI/UX**: Beautiful gradient design with smooth animations
- **Toast Notifications**: User-friendly feedback for all actions
- **Pagination**: Load more posts with infinite scroll functionality
- **Security**: Rate limiting, input validation, and secure file uploads
- **Database**: SQLite database with proper relationships and constraints

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup with modern structure
- **CSS3**: Advanced styling with Flexbox, Grid, and animations
- **JavaScript (ES6+)**: Modern JavaScript with async/await and modules
- **Font Awesome**: Beautiful icons for enhanced UI
- **Google Fonts**: Inter font family for modern typography

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Fast, unopinionated web framework
- **SQLite3**: Lightweight, serverless database
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing for security
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting for security

## 📁 Project Structure

```
social-media-platform/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   ├── script.js           # Frontend JavaScript
│   └── uploads/            # Image uploads directory
├── server.js               # Express server
├── package.json            # Dependencies and scripts
├── social_media.db         # SQLite database (auto-generated)
└── README.md              # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

1. **Install dependencies**
   ```bash
   npm install --production
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📊 Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password` (Hashed)
- `full_name`
- `bio`
- `profile_picture`
- `created_at`

### Posts Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `content`
- `image_url`
- `created_at`

### Comments Table
- `id` (Primary Key)
- `post_id` (Foreign Key)
- `user_id` (Foreign Key)
- `content`
- `created_at`

### Likes Table
- `id` (Primary Key)
- `post_id` (Foreign Key)
- `user_id` (Foreign Key)
- `created_at`

### Followers Table
- `id` (Primary Key)
- `follower_id` (Foreign Key)
- `following_id` (Foreign Key)
- `created_at`

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get user following
- `GET /api/users/search/:query` - Search users

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts (feed)
- `GET /api/users/:id/posts` - Get user posts
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - Get post comments

## 🎨 Design Features

### Modern UI Elements
- **Gradient Backgrounds**: Beautiful purple-blue gradients
- **Card-based Layout**: Clean, organized content presentation
- **Smooth Animations**: CSS transitions and keyframe animations
- **Hover Effects**: Interactive elements with hover states
- **Responsive Grid**: CSS Grid and Flexbox for layout
- **Custom Scrollbars**: Styled scrollbars for better UX

### Color Scheme
- **Primary**: #667eea (Purple Blue)
- **Secondary**: #764ba2 (Deep Purple)
- **Success**: #28a745 (Green)
- **Error**: #dc3545 (Red)
- **Info**: #17a2b8 (Blue)
- **Neutral**: #f0f2f5 (Light Gray)

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **File Upload Security**: Image validation and size limits
- **CORS Protection**: Cross-origin request protection
- **Security Headers**: Helmet.js for security headers

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- **Desktop**: Full-featured experience with sidebars
- **Tablet**: Optimized layout with collapsible elements
- **Mobile**: Mobile-first design with touch-friendly interactions

## 🚀 Performance Optimizations

- **Lazy Loading**: Images and content loaded on demand
- **Pagination**: Efficient data loading with pagination
- **Caching**: Browser caching for static assets
- **Optimized Images**: Compressed and optimized image uploads
- **Minimal Dependencies**: Lightweight package selection

## 🧪 Testing

The application includes comprehensive error handling and user feedback:
- **Toast Notifications**: Real-time user feedback
- **Error Boundaries**: Graceful error handling
- **Loading States**: Visual feedback during operations
- **Form Validation**: Client and server-side validation

## 🔧 Customization

### Environment Variables
Create a `.env` file for custom configuration:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
```

### Styling
The CSS is modular and easy to customize:
- Modify color variables in CSS custom properties
- Adjust animations and transitions
- Customize component styles

## 📈 Future Enhancements

Potential features for future development:
- **Real-time Chat**: WebSocket-based messaging
- **Push Notifications**: Browser notifications
- **Advanced Search**: Full-text search with filters
- **Media Gallery**: Enhanced media management
- **Dark Mode**: Theme switching capability
- **Mobile App**: React Native or Flutter app

## 🤝 Contributing

This project demonstrates full-stack development skills and can be extended with:
- Additional social features
- Enhanced security measures
- Performance optimizations
- UI/UX improvements

## 📄 License

This project is created for educational and portfolio purposes.

## 👨‍💻 Developer Notes

This social media platform showcases:
- **Full-stack Development**: Complete frontend and backend implementation
- **Modern JavaScript**: ES6+ features and async programming
- **Database Design**: Proper schema design and relationships
- **API Development**: RESTful API with proper HTTP methods
- **Security Best Practices**: Authentication, validation, and protection
- **Responsive Design**: Mobile-first approach with modern CSS
- **User Experience**: Intuitive interface with smooth interactions

Perfect for demonstrating web development skills in portfolios and interviews!




# Social-Media-Platform
# Social-Media-Platform
