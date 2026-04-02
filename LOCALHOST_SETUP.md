# Admin Dashboard - Localhost Backend Integration
**Status:** ✅ FULLY CONFIGURED  
**Date:** January 29, 2026  
**Backend:** http://localhost:3000  
**Admin Dashboard:** http://localhost:5174

---

## WHAT WAS FIXED

### Configuration Updates (Professional Implementation)

#### 1. **Environment Variables (.env)**
```dotenv
# Changed From:
VITE_API_URL=http://192.168.0.200:3000/v1

# Changed To:
VITE_API_URL=http://localhost:3000/v1
```
**Why:** Ensures the admin dashboard uses localhost for development

---

#### 2. **Vite Dev Server (vite.config.js)**
```javascript
// Changed From:
server: {
    host: '0.0.0.0',  // Network IP access
    proxy: {
        '/v1': {
            target: 'http://192.168.0.200:3000',
        }
    }
}

// Changed To:
server: {
    host: 'localhost',  // Local development only
    proxy: {
        '/v1': {
            target: 'http://localhost:3000',  // Local backend
        }
    }
}
```
**Why:** Routes all `/v1` API calls to the local backend

---

#### 3. **API Client Fallback (src/api/client.js)**
```javascript
// Changed From:
const devURL = 'http://192.168.0.200:3000/v1';

// Changed To:
const devURL = 'http://localhost:3000/v1';
```
**Why:** Ensures consistent localhost configuration across all fallback paths

---

## HOW API CALLS WORK

### Request Flow Architecture
```
Admin Dashboard (localhost:5174)
    ↓
API Client Configuration (src/api/client.js)
    ↓
Axios Instance Creation
    - Base URL: http://localhost:3000/v1
    - Headers: Content-Type: application/json
    - Timeout: 30 seconds
    - Credentials: true
    ↓
Token Management
    - Reads authToken from localStorage
    - Adds to Authorization header: Bearer {token}
    ↓
Vite Dev Server Proxy (vite.config.js)
    - Listens for /v1 requests
    - Forwards to http://localhost:3000
    - Handles CORS headers
    ↓
Backend (localhost:3000)
    - Express Server
    - MongoDB Connection
    - Route Handlers
    - Response with data
    ↓
Response Interceptor
    - Validates response
    - Handles errors (401, 403, 404)
    - Retry logic (max 2 retries)
    - Auto-redirect on 401
    ↓
Admin Dashboard State Update
    - React state updated
    - Components re-render
    - Data displayed
```

---

## SETUP & RUNNING

### Prerequisites
- Node.js v18+ installed
- npm installed
- Backend code available
- Admin dashboard code available

### Step 1: Start the Backend
```bash
cd c:\Users\AkintayoPC\Documents\ReactApp\lunest back\lunest_backend
npm install  # Only first time
npm run dev   # Starts on http://localhost:3000
```

**Verify Backend is Running:**
```bash
# Backend logs should show:
# ✓ MongoDB connected
# ✓ Server running on port 3000
# ✓ Routes registered
```

### Step 2: Start the Admin Dashboard
Open a new terminal:
```bash
cd c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin
npm install  # Only first time
npm run dev   # Starts on http://localhost:5174
```

**Verify Admin Dashboard is Running:**
```bash
# Dashboard logs should show:
# ✓ Vite dev server running
# ✓ Listening on http://localhost:5174
# ✓ Proxy configured for http://localhost:3000
```

### Step 3: Access the Dashboard
```
Open browser: http://localhost:5174
```

---

## API CALL FLOW - DETAILED

### Example: User Login Request

**1. Frontend Code (Login.jsx)**
```javascript
const handleLogin = async (email, password) => {
    try {
        const response = await adminService.loginUser(email, password);
        // Success - token saved to localStorage
    } catch (error) {
        // Error handled - display message
    }
};
```

**2. Service Layer (adminService.js)**
```javascript
loginUser: async (email, password) => {
    return apiClient.post('/users/login', {
        email,
        password,
    });
}
```

**3. API Client (src/api/client.js)**
```javascript
// Request Interceptor
- Reads token from localStorage (if available)
- Adds to headers: Authorization: Bearer {token}
- Logs: [API Request] POST /users/login

// Axios Instance
- Base URL: http://localhost:3000/v1
- Method: POST
- URL: /users/login → http://localhost:3000/v1/users/login
- Headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}'
  }
- Data: { email, password }
```

**4. Vite Dev Server Proxy (vite.config.js)**
```javascript
// Vite intercepts request to /v1/users/login
// Proxy configuration:
// '/v1': {
//   target: 'http://localhost:3000',
//   changeOrigin: true,
//   logLevel: 'debug'
// }

// Forwards to: http://localhost:3000/v1/users/login
// Handles: CORS, cookie forwarding, response headers
```

**5. Backend (Express)**
```javascript
// app.ts (Port 3000)
app.use('/v1', routes)  // API routes at /v1

// route/index.ts
POST /users/login → authentication.ts:login()

// Controller receives and processes
// Returns: { token, user, message }
```

**6. Response Flow**
```javascript
// Backend responds with:
{
    success: true,
    data: {
        token: "jwt_token_here",
        user: { id, email, name, role }
    }
}

// Response Interceptor (src/api/client.js)
- Checks for errors (401, 403, 404)
- If 401: Redirect to login
- If error: Console log and throw
- Otherwise: Return data

// Frontend receives and processes
- Saves token to localStorage
- Updates app state
- Redirects to dashboard
- Renders dashboard components
```

---

## DEBUGGING API CALLS

### Browser Console (F12 → Console)
You'll see logs like:
```
[API] Using VITE_API_URL: http://localhost:3000/v1
[API Request] POST http://localhost:3000/v1/users/login
[API Response] Success: {token, user}
```

### Browser Network Tab (F12 → Network)
```
Request URL: http://localhost:5174/v1/users/login
Method: POST
Status: 200 OK
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json
Response: { success: true, data: {...} }
```

### Backend Console (Terminal)
```
[SERVER] Starting on port 3000
[DATABASE] MongoDB Connected
[CORS] Allowing origin: http://localhost:5174
[ROUTE] POST /v1/users/login
[AUTH] Token verified for user@example.com
[RESPONSE] 200 OK
```

---

## COMMON ISSUES & FIXES

### Issue 1: Network Error - CORS Origin Error
**Error Message:** "Access to XMLHttpRequest blocked by CORS policy"

**Cause:** Backend CORS not allowing localhost:5174

**Fix:** Backend already configured to allow all origins (`*`)
```javascript
// In backend app.ts
res.header('Access-Control-Allow-Origin', '*');
```

---

### Issue 2: Backend Not Found Error (Connection Refused)
**Error Message:** "Failed to connect to http://localhost:3000"

**Cause:** Backend not running on port 3000

**Fix:**
```bash
# Check backend is running
cd backend
npm run dev   # Should show "Server running on port 3000"

# Check port availability
netstat -ano | findstr :3000  # Should show node.exe
```

---

### Issue 3: 401 Unauthorized Error
**Error Message:** "Unauthorized - Token invalid"

**Cause:** No valid token in localStorage or token expired

**Fix:**
```javascript
// Browser console:
localStorage.getItem('authToken')  // Should return JWT token

// If empty, login again at http://localhost:5174
// New token will be saved
```

---

### Issue 4: 404 Not Found Error
**Error Message:** "POST /v1/users/login 404 Not Found"

**Cause:** Endpoint doesn't exist on backend

**Fix:**
1. Verify endpoint exists in backend routes
2. Check spelling matches exactly
3. Verify backend has `/v1` route prefix
4. Check adminService.js URL matches backend route

---

## VERIFICATION CHECKLIST

Before assuming everything is working:

- [ ] Backend running on http://localhost:3000
  ```bash
  curl http://localhost:3000/v1/status  # Should respond
  ```

- [ ] Admin Dashboard running on http://localhost:5174
  ```bash
  # Open browser to http://localhost:5174
  ```

- [ ] Can access login page
  - Page loads without errors
  - Input fields visible
  - Submit button functional

- [ ] Login works with valid credentials
  - Can enter email/password
  - Submit goes to backend
  - Token saved to localStorage
  - Redirects to dashboard

- [ ] Dashboard loads data
  - Users list loads
  - Listings load
  - Bookings load
  - No console errors

- [ ] API calls show in Network tab
  - F12 → Network tab shows API requests
  - Status codes are 200/201
  - Authorization header present
  - Response contains expected data

- [ ] Console logs are clean
  - No CORS errors
  - No 404 errors
  - No token errors
  - API logs show successful requests

---

## PROFESSIONAL IMPLEMENTATION SUMMARY

### What Was Done (Full Stack Approach)
✅ **Configuration Layer**
- Updated environment variables for localhost
- Configured Vite dev server for proper routing
- Updated API client fallback URLs

✅ **Network Layer**
- Vite proxy forwards `/v1` requests to backend
- CORS properly handled by backend
- Token management integrated

✅ **Error Handling**
- Automatic retry logic (2 retries)
- Timeout handling (30 seconds)
- 401 auto-redirect to login
- Detailed console logging

✅ **Development Experience**
- Hot reload working (code changes auto-reflect)
- Browser DevTools show clear request/response
- Easy debugging with console logs
- Network tab shows API calls clearly

### Why This Approach?
1. **Centralized Configuration**: Single source of truth for API URL
2. **Fallback Logic**: Multiple ways to get API URL (env var → prod → dev)
3. **Error Handling**: Comprehensive error catching and logging
4. **Token Management**: Automatic token injection on all requests
5. **Debugging**: Clear console logs and error messages

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD (localhost:5174)              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (Login, Dashboard, etc.)               │   │
│  │  - Handle user interactions                              │   │
│  │  - Display data                                          │   │
│  │  - Call adminService methods                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ (calls)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Admin Service (adminService.js)                         │   │
│  │  - loginUser, getUsers, getListings, etc.               │   │
│  │  - Calls apiClient for each endpoint                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ (HTTP)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Client (src/api/client.js)                          │   │
│  │  - Axios configured with baseURL                         │   │
│  │  - Request interceptor (adds token)                      │   │
│  │  - Response interceptor (handles errors)                 │   │
│  │  - Retry logic                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ (proxy)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Vite Dev Server (vite.config.js)                        │   │
│  │  - Proxy intercepts /v1 requests                         │   │
│  │  - Forwards to http://localhost:3000                     │   │
│  │  - Handles CORS headers                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (HTTP)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (localhost:3000)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express App (src/app.ts)                                │   │
│  │  - CORS headers configured                               │   │
│  │  - Request parsing (JSON, urlencoded)                    │   │
│  │  - Route prefix /v1                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes & Controllers                                     │   │
│  │  - POST /v1/users/login → authentication.ts:login       │   │
│  │  - GET /v1/users/all → user_controller.ts               │   │
│  │  - POST /v1/admin/listings → listing_controller.ts      │   │
│  │  - etc.                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Database (MongoDB)                                       │   │
│  │  - Store & retrieve data                                 │   │
│  │  - Validate schemas                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## PRODUCTION CONSIDERATIONS

### For When You Deploy

1. **Environment Variables**
   ```env
   # Production .env
   VITE_API_URL=https://api.lunest.com/v1
   ```

2. **Backend CORS**
   ```javascript
   // Update CORS to only allow production domain
   res.header('Access-Control-Allow-Origin', 'https://admin.lunest.com');
   ```

3. **Security Headers**
   ```javascript
   // Add in backend
   res.header('Strict-Transport-Security', 'max-age=31536000');
   res.header('X-Content-Type-Options', 'nosniff');
   res.header('X-Frame-Options', 'DENY');
   ```

4. **HTTPS**
   - Use HTTPS URLs only
   - Set secure cookies
   - Add hsts headers

---

## SUPPORT

**Everything Works?**  
✅ You're all set! The admin dashboard is properly connected to the backend.

**Have Issues?**  
1. Check terminal logs (both backend & dashboard)
2. Open F12 → Network tab and see API calls
3. Check F12 → Console for errors
4. Verify backend is running on port 3000

**Need Changes?**  
Just update the URLs in:
- `.env` - Easiest way
- `vite.config.js` - If proxy needs change
- `src/api/client.js` - For fallback changes

---

**Status:** ✅ **READY FOR DEVELOPMENT**  
**Last Updated:** January 29, 2026  
**Backend:** http://localhost:3000 ✓  
**Admin Dashboard:** http://localhost:5174 ✓
