# Authentication Implementation - Login, Signup, Logout

## Overview
Complete authentication functionality has been implemented for the real-time chat application with login, signup (registration), and logout features.

## Backend Implementation

### 1. **User Model** (`backend/src/models/User.js`)
- Uses Sequelize ORM with SQLite database
- Password hashing with bcryptjs (10 salt rounds)
- Validates email format
- Tracks user status (online/offline/away) and lastSeen

### 2. **Auth Controller** (`backend/src/controllers/authController.js`)
**Routes implemented:**

#### Register (`POST /api/auth/register`)
- Validates all required fields: username, email, password, confirmPassword
- Password validation: minimum 6 characters
- Checks for duplicate email/username
- Password confirmation validation
- Returns JWT token and user data

#### Login (`POST /api/auth/login`)
- Validates email and password
- Compares password using bcryptjs
- Returns JWT token and user data on success
- Returns error for invalid credentials

#### Logout (`POST /api/auth/logout`) - **NEW**
- Protected route (requires valid JWT token)
- Clears user session on backend
- Returns success message

#### Get Profile (`GET /api/auth/profile`)
- Protected route
- Returns authenticated user's profile without password

#### Get All Users (`GET /api/auth/users`)
- Protected route
- Returns all users except current user

#### Update Profile (`PUT /api/auth/profile`)
- Protected route
- Supports username and profile picture updates
- Validates duplicate usernames

### 3. **Auth Routes** (`backend/src/routes/authRoutes.js`)
```javascript
POST   /register     - Register new user
POST   /login        - Login user
POST   /logout       - Logout user (protected)
GET    /profile      - Get current user profile (protected)
GET    /users        - Get all users (protected)
PUT    /profile      - Update profile (protected)
```

### 4. **Auth Middleware** (`backend/src/middlewares/auth.js`)
- Extracts JWT token from Authorization header
- Validates token signature and expiration
- Attaches decoded user info to request object
- Returns 401 for missing/invalid tokens

### 5. **JWT Utility** (`backend/src/utils/jwt.js`)
- `generateToken(userId)`: Creates signed JWT tokens
- Token expiration: 7 days (configurable via JWT_EXPIRE env var)
- Uses JWT_SECRET from environment

## Frontend Implementation

### 1. **Auth Context** (`frontend/src/context/AuthContext.jsx`)
**Features:**
- Stores user data and authentication token
- Manages loading state
- Persists token in localStorage
- Auto-loads user profile on app mount

**Functions:**
- `login(userData, token)`: Sets user and token in context
- `logout()`: Calls API endpoint and clears local state
- Automatically redirects to login on token expiration

### 2. **Login Page** (`frontend/src/pages/Login.jsx`)
- Form fields: email, password
- Error display with validation messages
- Link to registration page
- Auto-redirects to home on successful login
- Loading state management

### 3. **Register Page** (`frontend/src/pages/Register.jsx`)
- Form fields: username, email, password, confirmPassword
- Password confirmation validation
- Error handling and display
- Link to login page
- Auto-redirects to home on successful registration

### 4. **Protected Routes** (`frontend/src/components/ProtectedRoute.jsx`)
- Checks if user has valid token
- Redirects to login if not authenticated
- Allows access to protected pages

### 5. **Chat List Component** (`frontend/src/components/ChatList.jsx`)
**New Features:**
- User profile section at top
- Profile menu with logout button
- Displays current user username and email
- Logout button redirects to login page

### 6. **API Service** (`frontend/src/services/api.js`)
**Auth Methods:**
```javascript
authService.register(data)      - Create new account
authService.login(data)         - Login user
authService.logout()            - Logout user (NEW)
authService.getProfile()        - Get user profile
authService.getAllUsers()       - Get list of users
authService.updateProfile(data) - Update user profile
```

**Token Management:**
- Automatically adds Authorization header with Bearer token
- Stores token in localStorage
- Retrieves token for each API request

## Authentication Flow

### Signup Flow
1. User fills registration form (username, email, password)
2. Form validates password match and minimum length
3. Submit POST request to `/api/auth/register`
4. Backend validates and hashes password
5. User record created in database
6. JWT token generated and returned
7. Token stored in localStorage
8. User context updated with user data
9. Auto-redirect to home page

### Login Flow
1. User enters email and password
2. Submit POST request to `/api/auth/login`
3. Backend verifies credentials against stored hash
4. JWT token generated on success
5. Token stored in localStorage
6. User context updated
7. Auto-redirect to home page

### Logout Flow
1. User clicks logout button in profile menu
2. POST request sent to `/api/auth/logout` with token
3. Backend validates token
4. User context clears token and user data
5. localStorage cleared
6. Auto-redirect to login page

### Protected Route Access
1. App checks if token exists in context
2. If no token: redirect to login
3. If token exists: load user profile automatically
4. If token expired: logout triggered, redirect to login

## Security Features

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Tokens**: Signed with secret key, 7-day expiration
3. **Protected Routes**: All endpoints except register/login require valid token
4. **Token Validation**: Middleware verifies token before processing
5. **CORS Configuration**: Restricted to configured client URL
6. **Input Validation**: Email format, password requirements, duplicate checks

## Environment Variables Required

```
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
DATABASE_URL=sqlite://./data/chat.db
PORT=5000
```

## Testing the Authentication

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Logout (with token)
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Files Modified

### Backend
- `src/controllers/authController.js` - Added logout controller
- `src/routes/authRoutes.js` - Added logout route

### Frontend
- `src/context/AuthContext.jsx` - Enhanced with API logout call and profile auto-loading
- `src/services/api.js` - Added logout API method
- `src/components/ChatList.jsx` - Added profile section with logout button

## Status
✅ Login functionality - Complete
✅ Signup functionality - Complete
✅ Logout functionality - Complete
✅ Protected routes - Complete
✅ Token management - Complete
✅ Error handling - Complete
