TechReel

A full-stack web application built using MERN (MongoDB, Express, React, Node.js). It provides user authentication, profile management, and a foundation for social features like friend requests and public profiles.

Tech Stack
Layer	Technologies
Frontend	React, React Router DOM, Toastify
Backend	Node.js, Express.js
Database	MongoDB Atlas
Dev Tools	Visual Studio Code, Git & GitHub

Features Implemented
•	Signup and Login with validation
•	JWT-based Authentication
•	LocalStorage session persistence
•	Auto-generated Profile Page from signup
•	MongoDB Atlas Cloud Integration
•	Protected Routes and Navigation
•	Real-time frontend and backend running in parallel

Project Structure

techreel/
├── backend/
│   ├── src/
│   │   ├── config/         # DB & Firebase config
│   │   ├── controllers/    # API logic (auth, user)
│   │   ├── models/         # MongoDB models (User)
│   │   ├── routes/         # Express routes
│   │   ├── middlewares/    # Auth middleware
│   │   └── server.js       # Entry point
│   └── .env                # Environment variables
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/          # Signup, Login, Profile
│       ├── App.js
│       └── index.js

Setup Instructions

Prerequisites
•	Node.js v16+
•	Git
•	VS Code or similar editor
•	MongoDB Atlas account

Installation
1.	Clone the Repository:
  git clone https://github.com/SkillTalk/techreel.git
  cd techreel
2.	Backend Setup:
  cd backend
  npm install
3.	Create .env in /backend with:
  MONGO_URI=your_mongodb_uri
  JWT_SECRET=your_jwt_secret
  PORT=5000
4.	Run Backend:
  npm run dev
5.	Frontend Setup:
  cd ../frontend
  npm install
6.	Run Frontend:
  npm start

Usage
•	Open http://localhost:3000 in your browser.
•	Sign up or log in to access your profile.
•	JWT token and localStorage ensure session persistence.
Future Enhancements
•	Profile picture upload
•	Friend request system
•	Public profile viewing
•	Editable profile fields

Developer
Name: Gautam Kumar
Last Updated: 2025-06-07
GitHub: https://github.com/SkillTalk
