# Setup Guide for SocialConnect

## Prerequisites

Before running this social media platform, you need to install Node.js and npm.

### Installing Node.js

1. **Download Node.js**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the LTS (Long Term Support) version for Windows
   - Choose the Windows Installer (.msi) file

2. **Install Node.js**
   - Run the downloaded .msi file
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run these commands to verify:
   ```bash
   node --version
   npm --version
   ```

## Project Setup

Once Node.js is installed, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

## Alternative: Using Yarn

If you prefer using Yarn instead of npm:

1. **Install Yarn** (if not already installed):
   ```bash
   npm install -g yarn
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Start the server**:
   ```bash
   yarn dev
   ```

## Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Node.js is not installed or not added to PATH
   - Restart your terminal after installing Node.js
   - Reinstall Node.js if the issue persists

2. **Port 3000 already in use**
   - Change the port in `server.js`:
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```
   - Or kill the process using port 3000

3. **Permission errors**
   - Run Command Prompt or PowerShell as Administrator
   - Or use a different directory with write permissions

### Getting Help

If you encounter any issues:
1. Check that Node.js version is 14 or higher
2. Ensure all dependencies are installed correctly
3. Check the console for error messages
4. Verify the database file is created in the project root

## Features to Test

Once the application is running, you can test:

1. **User Registration**: Create a new account
2. **User Login**: Sign in with your credentials
3. **Create Posts**: Add text and images to posts
4. **Like Posts**: Click the heart icon to like posts
5. **Add Comments**: Comment on posts
6. **Follow Users**: Follow other users
7. **Search Users**: Use the search bar to find users
8. **Update Profile**: Change your profile picture and bio
9. **Responsive Design**: Test on different screen sizes

## Database

The application uses SQLite database which is automatically created when you first run the server. The database file (`social_media.db`) will be created in the project root directory.

## Security Notes

- The application includes JWT authentication
- Passwords are hashed using bcrypt
- File uploads are validated and secured
- Rate limiting is implemented for API protection

## Deployment

For production deployment:
1. Set environment variables
2. Use a production database (PostgreSQL, MySQL)
3. Configure proper security headers
4. Set up HTTPS
5. Use a process manager like PM2

Enjoy your social media platform! 🚀




