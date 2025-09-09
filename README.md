# TechReel - Social Networking Platform

A full-stack social networking web application built using MERN (MongoDB, Express, React, Node.js) with real-time features, user authentication, profile management, and social networking capabilities.

## 🚀 **Current Status - Both Services Running!**

✅ **Backend**: Running on PM2 (Port 5001) - All API endpoints functional  
✅ **Frontend**: Running on Port 3000 - React app serving correctly  
✅ **Database**: MongoDB Atlas connected and operational  
✅ **Real-time**: Socket.io for live messaging and updates  

## 🛠️ **Tech Stack**

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, React Router DOM, React Toastify, Socket.io Client |
| **Backend** | Node.js, Express.js, Socket.io, JWT Authentication |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Real-time** | Socket.io for live messaging and updates |
| **Process Manager** | PM2 for production-grade backend management |
| **Dev Tools** | Visual Studio Code, Git & GitHub |

## ✨ **Features Implemented**

### **Core Features**
• User authentication (signup/login) with JWT tokens  
• Profile management and customization  
• Real-time messaging (1-on-1 and group chats)  
• User following/following system  
• Group creation and management  
• File uploads and media sharing  
• Real-time notifications and updates  

### **Technical Features**
• JWT-based Authentication with bcrypt password hashing  
• LocalStorage session persistence  
• Protected routes and navigation  
• MongoDB Atlas cloud integration  
• RESTful API architecture  
• Socket.io real-time communication  
• PM2 process management for backend  

## 📁 **Project Structure**

```
techreel/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & Firebase config
│   │   ├── controllers/    # API logic (auth, user, messages, groups)
│   │   ├── models/         # MongoDB models (User, Message, Group, etc.)
│   │   ├── routes/         # Express API routes
│   │   ├── middlewares/    # Authentication & error middleware
│   │   ├── sockets/        # Socket.io event handlers
│   │   ├── utils/          # Helper functions
│   │   ├── app.js          # Express app configuration
│   │   └── server.js       # Server entry point with Socket.io
│   ├── ecosystem.config.js # PM2 configuration
│   ├── .env                # Environment variables
│   └── package.json        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/          # React page components
│   │   ├── components/     # Reusable UI components
│   │   ├── utils/          # API utilities and helpers
│   │   ├── App.js          # Main app component
│   │   └── index.js        # App entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## 🚀 **Quick Start - Get Both Services Running**

### **Prerequisites**
• Node.js v16+  
• Git  
• MongoDB Atlas account  
• PM2 (install globally: `npm install -g pm2`)  

### **1. Clone & Setup**
```bash
git clone https://github.com/SkillTalk/techreel.git
cd techreel
```

### **2. Backend Setup (PM2)**
```bash
cd backend
npm install

# Start with PM2 (recommended)
pm2 start ecosystem.config.js

# Or start manually
npm run dev
```

**Backend will run on:** http://localhost:5001

### **3. Frontend Setup**
```bash
cd ../frontend
npm install
npm start
```

**Frontend will run on:** http://localhost:3000

## 🎯 **Access URLs**

| Service | URL | Status |
|---------|-----|--------|
| **Frontend App** | http://localhost:3000 | ✅ Running |
| **Backend API** | http://localhost:5001 | ✅ Running |
| **Health Check** | http://localhost:5001/api/health | ✅ Working |
| **API Base** | http://localhost:5001/api | ✅ Working |

## 🛠️ **PM2 Backend Management**

### **Essential PM2 Commands**
```bash
# Check status
pm2 list

# View real-time logs
pm2 logs techreel-backend

# Monitor CPU/Memory
pm2 monit

# Restart backend
pm2 restart techreel-backend

# Stop backend
pm2 stop techreel-backend

# Start backend
pm2 start ecosystem.config.js

# Delete process
pm2 delete techreel-backend
```

### **PM2 Ecosystem Features**
- **Auto-restart** on crashes
- **File watching** for development
- **Log management** with rotation
- **Memory limits** and restart policies
- **Environment-specific** configurations

## 🔧 **Environment Configuration**

### **Backend (.env)**
```env
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/techreel
JWT_SECRET=your_super_secret_jwt_key
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_key
```

### **Frontend API Configuration**
The frontend automatically connects to:
- **Development**: http://localhost:5001/api
- **Production**: https://www.skilltalk.in/api

## 📱 **Available API Endpoints**

### **Authentication**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### **Users**
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get user following

### **Messages**
- `GET /api/messages/:userId` - Get user messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation

### **Groups**
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user groups
- `POST /api/groups/join` - Join group

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

**Backend won't start:**
```bash
# Check PM2 status
pm2 list

# View error logs
pm2 logs techreel-backend

# Restart with fresh config
pm2 delete techreel-backend
pm2 start ecosystem.config.js
```

**Frontend can't connect to backend:**
- Verify backend is running on port 5001
- Check browser console for CORS errors
- Ensure PM2 process is online

**Database connection issues:**
- Verify MongoDB Atlas IP whitelist
- Check MONGO_URI in .env file
- Ensure network connectivity

### **Port Conflicts**
If ports are already in use:
```bash
# Check what's using the ports
lsof -i :5001
lsof -i :3000

# Kill conflicting processes
kill -9 <PID>
```

## 🔄 **Development Workflow**

### **Making Changes**
1. **Backend**: Files are auto-watched by PM2
2. **Frontend**: React dev server auto-reloads
3. **Database**: Changes persist across restarts

### **Testing Changes**
- **Backend**: Test API endpoints with curl or Postman
- **Frontend**: Browser auto-refreshes on save
- **Real-time**: Test Socket.io connections

## 🚀 **Production Deployment**

### **Backend (PM2)**
```bash
# Set production environment
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### **Frontend**
```bash
cd frontend
npm run build
# Deploy build folder to your hosting service
```

## 📈 **Performance & Monitoring**

### **PM2 Monitoring**
```bash
# Real-time dashboard
pm2 monit

# Performance metrics
pm2 show techreel-backend

# Log analysis
pm2 logs techreel-backend --lines 1000
```

### **Health Checks**
- **API Health**: http://localhost:5001/api/health
- **Server Status**: Check PM2 process list
- **Database**: MongoDB connection status

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 **Support & Contact**

**Developer:** Gautam Kumar  
**GitHub:** https://github.com/SkillTalk  
**Project:** TechReel Social Networking Platform  
**Last Updated:** August 27, 2025  

---

## 🎉 **Ready to Use!**

Your TechReel application is now running with:
- ✅ **Backend on PM2** (Port 5001)
- ✅ **Frontend React App** (Port 3000)  
- ✅ **Real-time messaging** via Socket.io
- ✅ **MongoDB Atlas** database
- ✅ **JWT authentication** system

**Open http://localhost:3000 in your browser to start using the app!**
