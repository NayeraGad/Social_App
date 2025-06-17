# Social App – RESTful Backend API

An Express.js + MongoDB backend powering a basic social networking app. It supports user registration, authentication, post creation, and account management.

---

## ⚙️ Built With

- **Node.js** + **Express**
- **MongoDB** with Mongoose ODM
- **Authentication:** bcrypt & JWT
- **Security:** CORS
- **Dotenv** for config
- **Custom Error Handling** middleware

---

## 📁 Project Structure

📦 social_app

┣ 📂config/ # Environment setup

┣ 📂src

┃ ┣ 📂DB /# Database connection and Mongoose schemas

┃ ┣ 📂middlewares /# Global error handler, auth, etc

┃ ┣ 📂modules /# Route modules

┃ ┣ 📂service/ # Email service

┃ ┣ 📂utilities /# Reusable utilities

┃ ┗ 📜app.controller.js # Routes handler

┗ 📜index.js #App entry point

---

🧪 Features

✅ User signup and login

✅ Signup/Login with Google (via OAuth 2.0)

✅ JWT-based authentication

✅ Add and communicate with friends

✅ Create, get, and delete posts

✅ Comment and react on posts

✅ Delete user account

✅ CORS and security headers

✅ Global error and async error handling

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/NayeraGad/Social_App.git
cd Social_App
npm install
```

### 3. Configure environment variables

Create a .env file based on .env.example:

```
# Server Configuration
PORT=3000
MODE=DEV or PRODUCT

# MongoDB Connection
URI=your_mongodb_connection_string

# Email Configuration (used for sending verification or reset emails)
EMAIL=your_email@example.com
PASSWORD=your_email_app_password

# Security
SALT_ROUNDS=10
SECRET_KEY=your_super_secret_key

# JWT Signatures for Access and Refresh Tokens
SIGNATURE_ACCESS_ADMIN=admin_access_token_secret
SIGNATURE_ACCESS_USER=user_access_token_secret
SIGNATURE_REFRESH_ADMIN=admin_refresh_token_secret
SIGNATURE_REFRESH_USER=user_refresh_token_secret

# Token Prefixes
PREFIX_ADMIN=admin
PREFIX_USER=user

# Google OAuth (for Gmail signup/login)
CLIENT_ID=your_google_oauth_client_id

# Cloudinary (for image uploads)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

### 4. Start the server

```
npm start
```

---

## 📫 API Documentation

Explore the full API structure via Postman:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://documenter.getpostman.com/view/36251048/2sAYQggTQq)

> 🔧 This API is currently not deployed. Use the documented request/response structure with `http://localhost:3000` or your preferred test environment.
