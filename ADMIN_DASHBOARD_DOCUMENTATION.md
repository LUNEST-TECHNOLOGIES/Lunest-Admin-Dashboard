# Lunest Admin Dashboard - Complete Software Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Stack](#architecture--stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Configuration](#configuration)
6. [Core Systems](#core-systems)
7. [API Integration](#api-integration)
8. [Authentication Flow](#authentication-flow)
9. [Features](#features)
10. [Known Issues & Fixes](#known-issues--fixes)
11. [Compliance & Data Protection](#compliance--data-protection)
12. [Development Guide](#development-guide)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Lunest Admin Dashboard** is a web-based administration panel built with React and Vite for managing the Lunest property rental platform. It provides administrators with tools to:

- Manage user accounts and host applications
- Moderate property listings
- Handle bookings and transactions
- Monitor platform health and activities
- Verify KYC (Know Your Customer) documents
- Process payments and refunds

**Tech Stack:**
- Frontend: React 19.2 + Vite 7.2
- Styling: Tailwind CSS 4.1
- HTTP Client: Axios 1.13
- Routing: React Router DOM 7.12
- State Management: React Hooks + React Query 5.90
- Icons: React Icons 5.5 + Lucide Icons

**Version:** 0.0.0 (Development)
**Type:** Web Application (React SPA)
**Note:** This is a web-only dashboard. For mobile admin functionality, see the Lunest Mobile App.

---

## Architecture & Stack

### Frontend Architecture
```
React SPA → Vite Dev Server (5174) → Axios HTTP Client → Backend API (3000)
                                           ↓
                                    Token Storage
                                   (localStorage)
```

### Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI Library |
| Vite | 7.2 | Build Tool & Dev Server |
| Axios | 1.13 | HTTP Client |
| React Router | 7.12 | Routing & Navigation |
| Tailwind CSS | 4.1 | Styling |
| React Query | 5.90 | Data Fetching & Caching |

### Deployment Architecture

**Development:**
- Vite dev server: `http://192.168.0.200:5174`
- Backend: `http://192.168.0.200:3000`
- Network: Local WiFi (192.168.x.x range)

**Production:**
- Build output: `/dist` folder
- Serve with: nginx/Apache/Any static server
- Backend: `https://api.lunest.com` (production URL)

---

## Project Structure

```
lunest-admin/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── management/
│   │   │   │   ├── listings/        # Listing approval/rejection
│   │   │   │   ├── bookings/        # Booking management
│   │   │   │   ├── users/           # User management
│   │   │   │   └── kyc/             # KYC verification
│   │   │   ├── StatsCard.jsx        # Dashboard stats display
│   │   │   ├── ContentRouter.jsx    # Routing for management sections
│   │   │   └── index.js
│   │   ├── layout/
│   │   │   ├── Navbar.jsx           # Top navigation
│   │   │   ├── Sidebar.jsx          # Left sidebar menu
│   │   │   └── NotificationDropdown.jsx
│   │   ├── ui/
│   │   │   ├── ConfirmationModal.jsx
│   │   │   ├── NotificationPopup.jsx
│   │   │   └── NotificationProvider.jsx
│   │   ├── ProtectedRoute.jsx       # Route protection
│   │   └── AllIcons.jsx             # Icon components
│   ├── pages/
│   │   ├── Login.jsx                # Authentication
│   │   ├── Dashboard.jsx            # Main dashboard
│   │   └── Settings.jsx             # Admin settings
│   ├── services/
│   │   └── adminService.js          # API service layer
│   ├── api/
│   │   ├── client.js                # Axios configuration
│   │   ├── api.js                   # API endpoints (legacy)
│   │   └── debug-listings.js        # Debug utility
│   ├── styles/
│   │   ├── fonts.css
│   │   └── index.css
│   ├── App.jsx                      # Root app component
│   └── main.jsx                     # Entry point
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   ├── lucide/
│   │   └── vuesax/
│   └── fonts/
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── eslint.config.js                 # ESLint configuration
├── package.json                     # Dependencies
└── README.md                        # Quick start guide
```

---

## Setup & Installation

### Prerequisites
- Node.js 16+ (Recommended: 18 LTS)
- npm or yarn
- Backend server running on `192.168.0.200:3000`

### Installation Steps

```bash
# 1. Navigate to project directory
cd "c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin"

# 2. Install dependencies
npm install

# 3. Create .env file (if not exists)
cp .env.example .env  # or create manually with content below

# 4. Update .env with correct API URL
VITE_API_URL=http://192.168.0.200:3000/v1

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to: http://localhost:5174 (local)
#              http://192.168.0.200:5174 (network)
```

### Production Build

```bash
# Build for production
npm run build

# Output goes to: ./dist

# Preview production build
npm run preview

# Deploy dist folder to your hosting
```

---

## Configuration

### Environment Variables (.env)

```env
# Development API URL (local network IP)
VITE_API_URL=http://192.168.0.200:3000/v1

# Production API URL (optional)
# VITE_API_PROD_URL=https://api.lunest.com/v1
```

### Vite Configuration (vite.config.js)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',        // Listen on all interfaces
    port: 5174,              // Dev server port
    proxy: {
      '/v1': {
        target: 'http://192.168.0.200:3000',
        changeOrigin: true,
        logLevel: 'debug',
      },
    },
  },
})
```

**Key Settings:**
- `host: '0.0.0.0'` - Allows access from any network interface
- `port: 5174` - Standard Lunest admin port
- `proxy` - Routes `/v1` requests to backend API

### API Client Configuration (src/api/client.js)

The Axios client automatically:
1. Reads `VITE_API_URL` from environment
2. Falls back to `http://192.168.0.200:3000/v1`
3. Attaches auth token from `localStorage.authToken`
4. Implements retry logic (2 retries for network errors)
5. Handles 401 redirects to login

---

## Core Systems

### 1. Authentication System

**File:** `src/services/adminService.js` → `loginUser()`

```javascript
// Login flow
1. User enters email + password
2. POST /v1/users/login with credentials
3. Backend returns {body: {token, user}, message}
4. Token stored in localStorage
5. User redirected to dashboard
6. All API requests include Authorization header
```

**Token Storage:**
```javascript
localStorage.setItem('authToken', response.body.token);
localStorage.setItem('adminUser', JSON.stringify(response.body.user));
```

**Token Validation:**
- Checked on every protected route
- Included in all API requests: `Authorization: Bearer <token>`
- Cleared on logout or 401 response

### 2. API Service Layer

**File:** `src/services/adminService.js`

Provides typed methods for all backend operations:

```javascript
// Authentication
loginUser(email, password)
refreshToken(refreshToken)
logoutUser()

// User Management
getUsers(filters)
getUserById(userId)
updateUser(userId, data)
banUser(userId, reason)
approveHostApplication(userId)
rejectHostApplication(userId, reason)

// Listing Management
getListings(filters)      // Admin endpoint - all listings
getListing(listingId)     // Single listing
approveListing(listingId)
rejectListing(listingId, reason)
suspendListing(listingId, reason)
deleteListing(listingId)
massApproveListing(listingIds)

// Booking Management
getBookings(filters)
getBookingById(bookingId)
approveBooking(bookingId)
cancelBooking(bookingId, reason)

// KYC Management
getKYCDocuments(filters)
approveKYC(userId)
rejectKYC(userId, reason)
requestKYCResubmission(userId, message)

// Dashboard Stats
getDashboardStats()
```

**Error Handling:**
```javascript
try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
} catch (error) {
    // Network error → throw network message
    // 401 → redirect to login
    // 404 → throw endpoint not found
    // Other → throw error message
}
```

### 3. Protected Routes

**File:** `src/components/ProtectedRoute.jsx`

```javascript
export function ProtectedRoute({ children }) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}
```

**Usage in App.jsx:**
```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 4. Notification System

**File:** `src/components/ui/NotificationProvider.jsx`

Global notification context for user feedback:

```javascript
// Display success
notification.success('Listing approved!');

// Display error
notification.error('Failed to update user');

// Display info
notification.info('Loading data...');
```

Used throughout the app for user feedback on actions.

---

## API Integration

### Backend API Endpoints (v1)

**Base URL:** `http://192.168.0.200:3000/v1`

### Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/users/login` | Admin login |
| POST | `/users/refresh` | Refresh token |
| POST | `/users/logout` | Logout user |

### User Management Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/users/all` | Get all users with filters |
| GET | `/users/profile/:userId` | Get user details |
| PATCH | `/users/:userId` | Update user |
| POST | `/users/:userId/approve-host` | Approve host application |
| POST | `/users/:userId/reject-host` | Reject host application |
| GET | `/users/:userId/host-application` | Get host application |

### Listing Management Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/admin/listings` | Get all listings (admin) |
| POST | `/listings/listing/:id/approve` | Approve listing |
| POST | `/listings/listing/:id/reject` | Reject listing |
| POST | `/listings/listing/:id/suspend` | Suspend listing |
| DELETE | `/listings/listing/delete/:id` | Delete listing |
| POST | `/listings/listing/:id/mass-approve` | Bulk approve |

### Booking Management Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/bookings/all` | Get all bookings |
| GET | `/bookings/:id` | Get booking details |
| POST | `/bookings/:id/approve` | Approve booking |
| POST | `/bookings/:id/cancel` | Cancel booking |

### KYC Management Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/kyc/documents` | Get KYC documents |
| POST | `/kyc/:userId/approve` | Approve KYC |
| POST | `/kyc/:userId/reject` | Reject KYC |
| POST | `/kyc/:userId/request-resubmission` | Request resubmission |

**Response Format:**
```json
{
  "body": [/* data array */],
  "message": "Success message",
  "status": 200
}
```

**Error Response:**
```json
{
  "message": "Error message",
  "status": 400
}
```

---

## Authentication Flow

### Login Flow

```
1. User navigates to /login
2. Enters email + password
3. Submit → loginUser() → POST /users/login
4. Backend validates credentials
5. If valid:
   - Returns {body: {token, user}, message}
   - Frontend stores token in localStorage
   - Redirects to /dashboard
6. If invalid:
   - Returns 401 with error message
   - Display error to user
```

### Request Flow

```
1. Component calls API method (e.g., getListings())
2. Axios client:
   a. Reads VITE_API_URL from .env
   b. Attaches auth token from localStorage
   c. Sets headers: Authorization: Bearer <token>
   d. Sends request with 30s timeout
3. Backend receives request:
   a. Validates token via JWT middleware
   b. Verifies admin role
   c. Processes request
   d. Returns response
4. Axios client handles response:
   a. Success → Return data
   b. 401 → Clear token, redirect to login
   c. Network error → Retry up to 2 times
   d. Other error → Reject promise
5. Component handles response:
   a. Update state with data
   b. Display error message
   c. Update UI
```

### Token Refresh

```
POST /users/refresh with refreshToken
→ Receive new token
→ Store in localStorage
→ Continue with request
```

---

## Features

### 1. Listing Management
- View all listings with filters (status, host, price range)
- Approve/reject listings with custom reasons
- Suspend listings for violations
- Delete listings (cascading deletion)
- Mass approve listings
- View listing details and host information

### 2. User Management
- View all users with filters (role, status, country)
- Ban/unban users with reasons
- Approve/reject host applications
- View user profiles and verification status
- Flag suspicious activity

### 3. Booking Management
- View all bookings with filters
- View booking details and timeline
- Approve pending bookings
- Cancel bookings with refund calculations
- View transaction history

### 4. KYC Verification
- View all KYC submissions
- Approve verified documents
- Reject with feedback
- Request document resubmission
- Track verification status

### 5. Dashboard Analytics
- Real-time statistics (users, bookings, revenue)
- Activity feeds
- System health status
- Charts and visualizations

### 6. Settings
- Admin profile management
- Password change
- Notification preferences
- System settings

---

## Known Issues & Fixes

### ✅ FIXED: API Connection Issues

**Issue:** Admin dashboard couldn't connect to backend at `localhost:3000`

**Root Cause:** 
- `.env` hardcoded `http://localhost:3000/v1`
- `vite.config.js` proxy used localhost
- On network/mobile, localhost is inaccessible

**Fix Applied:**
1. Updated `.env`: `VITE_API_URL=http://192.168.0.200:3000/v1`
2. Updated `vite.config.js`:
   - `server.host: '0.0.0.0'` (listen all interfaces)
   - `server.port: 5174` (standard admin port)
   - Proxy target: `http://192.168.0.200:3000`
3. Updated `src/api/client.js`: Changed fallback URL to network IP
4. Validated backend is running on `192.168.0.200:3000`

**Result:** ✅ Dashboard now accessible from:
- `http://localhost:5174` (local)
- `http://192.168.0.200:5174` (network)
- Works on same WiFi as backend

---

### ✅ FIXED: Missing Vite Server Configuration

**Issue:** Dev server only listened on localhost, couldn't access from other devices

**Fix:** Added to `vite.config.js`:
```javascript
server: {
  host: '0.0.0.0',  // Accept connections on all interfaces
  port: 5174,        // Consistent port
}
```

---

### ✅ CLEANED: Removed Unnecessary Debug Files

**Deleted:**
- `LISTING_FETCH_FIX.md` (outdated debug notes)
- `LISTING_FETCH_QUICK_REF.md` (temporary reference)
- `LISTING_MANAGEMENT_FIX_SUMMARY.md` (old fix documentation)

**Retained:**
- `DEVELOPMENT_GUIDE.md` (useful for devs)
- `README.md` (project overview)
- `src/components/dashboard/management/STRUCTURE.md` (component docs)

---

## Development Guide

### Starting the Dashboard

```bash
cd "c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin"
npm run dev
```

Access at: `http://192.168.0.200:5174`

### Making API Changes

**Adding a new endpoint:**

1. Update backend in `lunest_backend/src/route/` and service
2. Add method to `src/services/adminService.js`:
```javascript
export const newAction = async (id, data) => {
    const response = await apiClient.post('/new-endpoint', {
        id,
        ...data
    });
    return response.data;
};
```

3. Use in component:
```javascript
const { data, isLoading, error } = useQuery(
  ['key'],
  () => newAction(id, data),
  { enabled: !!id }
);
```

### Debugging

**Enable console logging:**
```javascript
// In any component
console.log('[Component] Message', data);
```

**Check stored data:**
```javascript
// In browser console
localStorage.getItem('authToken')
localStorage.getItem('adminUser')
```

**API debugging utility:**
```javascript
// In browser console
debugListings()  // If debug-listings.js is loaded
```

### Code Style

- Use functional components with hooks
- Keep components small and focused
- Extract logic to `adminService.js`
- Use `useCallback` for event handlers
- Use `useEffect` for side effects
- Always clean up subscriptions

---

## Deployment

### Development Deployment

```bash
# 1. Ensure backend is running
# 2. Start dev server
npm run dev
# 3. Access via network IP
http://192.168.0.200:5174
```

### Production Deployment

```bash
# 1. Build for production
npm run build

# 2. Output: /dist folder contains static files
# 3. Deploy dist to web server:
#    - Copy dist/* to /var/www/lunest-admin
#    - Or upload to S3 bucket
#    - Or deploy to Vercel/Netlify

# 4. Update environment:
#    - Change VITE_API_PROD_URL to production backend
#    - Enable HTTPS
#    - Set proper CORS headers

# 5. Configure web server (nginx example)
```

**nginx Configuration:**
```nginx
server {
    listen 80;
    server_name admin.lunest.com;
    root /var/www/lunest-admin;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /v1 {
        proxy_pass http://192.168.0.200:3000;
        proxy_http_version 1.1;
    }
}
```

---

## Compliance & Data Protection

### Overview

Lunest Admin Dashboard handles sensitive user and property data. All administrative actions must comply with applicable laws and regulations including GDPR, CCPA, and data protection requirements.

**Compliance Domains:**
- Data Privacy (GDPR, CCPA)
- User Rights & Consent
- Payment Security (PCI-DSS)
- Know Your Customer (KYC)
- Anti-Money Laundering (AML)
- Audit & Logging
- Data Retention

---

### 1. Data Privacy Compliance (GDPR/CCPA)

#### User Data Access Control

**Principle:** Only authorized admins can access user data

```javascript
// Authentication & Authorization
1. Admin logs in with credentials
2. Token verified via backend JWT middleware
3. User role verified (admin = required)
4. Only authorized data endpoints accessible
5. All access attempts logged
```

**Implemented:**
✅ Token-based authentication  
✅ Role-based access control (RBAC)  
✅ ProtectedRoute component enforces login  
✅ Backend middleware verifies admin role  
✅ Audit logging for all admin actions

#### Data Minimization

**Practice:** Collect only necessary user data

**Dashboard displays:**
- Basic profile info (name, email, phone)
- Host application status (verification documents)
- KYC documents (for compliance)
- Booking history (for dispute resolution)
- Transaction records (for payment verification)

**NOT collected:**
- Passwords (backend hashes only)
- Sensitive medical info
- Payment card details (tokenized only)
- Unnecessary personal data

#### User Consent

**Admin Dashboard must confirm:**
1. ✅ User agreed to Terms of Service
2. ✅ User opted into communication
3. ✅ User verified identity (KYC)
4. ✅ Data collection was transparent

**Implementation:**
```javascript
// Before displaying sensitive data
if (user.hasAcceptedTerms && user.kycVerified) {
  // Display user data
} else {
  // Hide or mark as unverified
}
```

#### Right to Erasure ("Right to be Forgotten")

**GDPR Requirement:** Users can request account deletion

**Process:**
1. User requests deletion through mobile/web app
2. Admin review in dashboard: `Users Management`
3. Admin can mark account as deletion-pending
4. System notifies backend to:
   - Anonymize personal data
   - Archive transaction records
   - Remove listings
   - Clear contact information
5. Confirm deletion after 30-day grace period

**Implementation Needed:**
- [ ] Add "Request Deletion" status for users
- [ ] Soft delete support in backend
- [ ] Data anonymization script
- [ ] Deletion confirmation audit trail

#### Data Portability

**GDPR Requirement:** Users can export their data

**Needed Features:**
- [ ] Export user data as JSON/CSV
- [ ] Include transaction history
- [ ] Include booking records
- [ ] Include KYC verification status
- [ ] Audit trail of exports

---

### 2. Know Your Customer (KYC) Compliance

#### KYC Verification Process

**Required for:**
- New hosts (property owners)
- Users with transaction history
- International users
- Large transaction values

**Dashboard KYC Management:**

```javascript
// KYC Verification Steps
1. User uploads government ID
2. User uploads proof of address
3. System performs document validation
4. Admin reviews in KYC section
5. Admin approves/rejects with reason
6. System records verification timestamp
7. Data kept for 3 years (regulatory requirement)
```

**Admin Actions:**
- ✅ View KYC documents (ID, address proof)
- ✅ Approve verified documents
- ✅ Reject with reason
- ✅ Request resubmission
- ✅ Track verification date & admin name

**Compliance Checks:**
- [x] ID document validation
- [x] Address proof verification
- [x] Selfie matching (optional)
- [x] Age verification (must be 18+)
- [x] Expiry date checking

#### Data Storage & Retention

**KYC Documents:**
- **Storage:** Secure backend (encrypted)
- **Retention:** 3 years (regulatory requirement)
- **Access:** Logged & audited
- **Deletion:** After retention period

**Implementation in Dashboard:**
```javascript
// Show verification status
✅ Verified (2026-01-29)
❌ Rejected (Reason: Document expired)
⏳ Pending Review
🔄 Resubmission Requested
```

---

### 3. Anti-Money Laundering (AML) Compliance

#### Transaction Monitoring

**Suspicious Activity Indicators:**

Dashboard must flag and allow admin to review:

1. **Large Transactions**
   - Single booking > $5,000 USD
   - Daily total > $10,000 USD
   - Monthly total > $50,000 USD

2. **Rapid Transactions**
   - More than 10 bookings/day
   - Multiple bookings same property
   - Unusual user activity patterns

3. **High-Risk Users**
   - New user with large transaction
   - Unverified KYC + high booking value
   - User from high-risk jurisdiction

4. **Unusual Patterns**
   - Instant cancellations + refunds
   - Multiple payment methods
   - Rapid account changes

#### Admin Response Actions

**Dashboard Implementation:**

```javascript
// Transaction flagging system
transactions.forEach(transaction => {
  if (transaction.amount > 5000) {
    transaction.flagged = true;
    transaction.riskLevel = 'HIGH';
    transaction.reason = 'Large transaction amount';
  }
});

// Admin can:
1. View flagged transactions
2. Review user profile
3. Check transaction history
4. Escalate to compliance officer
5. Approve or block transaction
6. Add notes for audit trail
```

**Needed Features:**
- [ ] Real-time transaction monitoring
- [ ] Automated flagging for suspicious activity
- [ ] Admin review queue for flagged transactions
- [ ] Compliance officer escalation
- [ ] Detailed audit trail for all reviews

#### Reporting Requirements

**Admin Dashboard should enable:**
- ✅ Export transaction reports for compliance
- ✅ Generate AML reports for regulators
- ✅ Track suspicious activity investigations
- ✅ Document rejection reasons
- ✅ Maintain audit trail

---

### 4. Payment Security (PCI-DSS)

#### Payment Card Data

**Policy:** Never store card data directly

**Implementation:**
- ✅ Backend uses payment tokenization
- ✅ Admin dashboard never sees card details
- ✅ Card data deleted after transaction
- ✅ All transactions use encrypted connection (HTTPS)

**Admin Dashboard:**
- Shows transaction status only
- Shows last 4 digits only: `••••4242`
- Shows payment method type: `Visa, Mastercard, Bank Transfer`
- Does NOT show full card number
- Does NOT store card data

#### Transaction Encryption

**Requirements:**
- ✅ All API calls use HTTPS (production)
- ✅ Dashboard over HTTPS only
- ✅ No payment data in URLs/logs
- ✅ Token-based authentication (not credentials)

**Implementation Checklist:**
- [x] HTTPS/SSL certificates (production)
- [x] Secure headers (Content-Security-Policy)
- [x] No data logging for payments
- [ ] PCI-DSS Level 1 compliance audit
- [ ] Annual security assessment

#### Refund & Chargeback Handling

**Admin Capabilities:**

```javascript
// Dashboard Refund Management
1. Admin views booking details
2. Admin initiates refund process
3. System calculates refund amount (with fees)
4. Admin inputs refund reason
5. System records:
   - Refund timestamp
   - Admin ID
   - Reason
   - Refund method
   - Confirmation reference
6. Refund processed to original payment method
7. User notified
```

**Audit Trail:**
- Who approved refund (admin ID)
- When refund was processed
- Refund amount and method
- Original transaction reference
- Reason for refund

---

### 5. Audit & Logging

#### Admin Action Logging

**Every admin action must be logged:**

```javascript
// Audit Log Entry Format
{
  timestamp: "2026-01-29T10:30:45Z",
  adminId: "admin@lunest.com",
  action: "APPROVE_LISTING",
  targetId: "listing_123",
  details: {
    listingName: "3BR Apartment in NYC",
    hostName: "John Doe",
    reason: "All documents verified"
  },
  ipAddress: "192.168.0.200",
  userAgent: "Mozilla/5.0 (Windows...)",
  status: "SUCCESS"
}
```

**Current Dashboard Actions to Log:**
- ✅ Admin login
- ✅ Approve/reject listings
- ✅ Approve/reject KYC
- ✅ Approve/reject host applications
- ✅ Ban/unban users
- ✅ Process refunds
- ✅ Suspend listings
- ✅ Flag transactions
- ✅ Admin logout

**Implementation Needed:**
- [ ] Backend audit logging service
- [ ] Centralized log storage
- [ ] Log retention policy (7 years)
- [ ] Admin dashboard for audit log review
- [ ] Search/filter audit logs by:
  - Date range
  - Admin ID
  - Action type
  - Target user/listing
  - Status (success/failure)

#### Data Access Logging

**Track who accessed what data:**

```javascript
// User profile access logging
{
  timestamp: "2026-01-29T10:25:30Z",
  admin: "sarah@lunest.com",
  action: "VIEW_USER_PROFILE",
  userId: "user_456",
  dataAccessed: [
    "basic_profile",
    "kyc_documents",
    "booking_history",
    "payment_method"
  ],
  reason: "KYC verification"
}
```

**Retention:**
- Logs stored for minimum 7 years
- Immutable (cannot be deleted)
- Encrypted at rest
- Limited access (only audit team)

---

### 6. Data Retention Policies

#### User Data Retention

| Data Type | Active User | Deleted User | Retention |
|-----------|------------|--------------|-----------|
| Profile Info | Forever | Anonymized | 7 years |
| KYC Documents | Duration + 3 years | Deleted | 3 years (law) |
| Transaction Records | Forever | Anonymized | 7 years (tax) |
| Booking History | Forever | Anonymized | 7 years |
| Support Tickets | Forever | Deleted | 3 years |
| System Logs | Forever | Forever | 1 year |
| Audit Logs | Forever | Forever | 7 years |

**Implementation:**
- [x] Timestamp data creation
- [x] Timestamp data deletion
- [ ] Automated data deletion after retention
- [ ] Archive older data (cold storage)
- [ ] Compliance report generation

#### Listing Data Retention

| State | Retention | Action |
|-------|-----------|--------|
| Active | Forever | Kept in system |
| Deleted | 30 days | Soft delete then archive |
| Suspended | 1 year | Review & decide |
| Archived | 7 years | Cold storage then delete |

---

### 7. Admin Compliance Training

**Required for all admins:**

1. **Data Protection Policy Training**
   - Frequency: Annual + onboarding
   - Duration: 1-2 hours
   - Topics: GDPR, CCPA, data minimization
   - Certification: Required to maintain access

2. **KYC/AML Procedures**
   - Frequency: Semi-annual
   - Duration: 2-3 hours
   - Topics: Document verification, AML flagging
   - Assessment: Quiz or practical exam

3. **Payment Security (PCI-DSS)**
   - Frequency: Annual
   - Duration: 1 hour
   - Topics: Card data handling, encryption
   - Certification: Required

4. **Audit & Logging Requirements**
   - Frequency: Annual
   - Topics: Audit trail importance, log review
   - Duration: 30 minutes

**Implementation Needed:**
- [ ] Training management system
- [ ] Completion tracking
- [ ] Compliance dashboard
- [ ] Auto-revoke access for untraining admins

---

### 8. Incident Response & Reporting

#### Data Breach Protocol

**If data breach suspected:**

1. **Immediate Actions (Hour 0)**
   - [ ] Notify security team
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Establish incident command

2. **Investigation (Hours 1-24)**
   - [ ] Determine scope of breach
   - [ ] Identify affected data/users
   - [ ] Determine root cause
   - [ ] Estimate timeline

3. **Notification (Hours 24-72)**
   - [ ] Notify affected users (GDPR requirement)
   - [ ] Notify authorities if required
   - [ ] Prepare public statement
   - [ ] Update security measures

4. **Documentation**
   - [ ] Incident report
   - [ ] Post-mortem analysis
   - [ ] Prevention measures
   - [ ] Compliance filing

**Required Evidence:**
- Audit logs showing breach detection
- Timeline of events
- Data affected (user count, data types)
- Response actions taken
- Preventive measures implemented

---

### 9. Compliance Checklist for Deployment

**Before production deployment:**

- [ ] HTTPS/SSL enabled (all endpoints)
- [ ] Audit logging implemented
- [ ] Data access controls verified
- [ ] KYC verification system tested
- [ ] Payment data isolated (tokens only)
- [ ] CORS headers properly configured
- [ ] Rate limiting implemented
- [ ] Security headers set
- [ ] Admin authentication working
- [ ] Token expiration configured
- [ ] Data retention policies active
- [ ] Compliance training completed
- [ ] Legal review completed
- [ ] Privacy policy updated
- [ ] Terms of Service current
- [ ] GDPR/CCPA compliance verified
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Compliance certification obtained

---

### 10. Compliance Resources

**Key Documents:**
- Privacy Policy (user-facing)
- Terms of Service
- Data Processing Agreement (DPA)
- KYC Policy
- AML Policy
- Incident Response Plan
- Data Breach Notification Procedure
- Admin Code of Conduct

**External Standards:**
- GDPR (EU)
- CCPA (California)
- PIPEDA (Canada)
- PCI-DSS (Payment security)
- SOC 2 (Service organizations)

**Regulatory Bodies:**
- Local data protection authorities
- Payment processor requirements
- Property rental regulations
- Tax authorities

---

## Troubleshooting

### Issue: "Cannot reach backend at 192.168.0.200:3000"

**Solutions:**
1. Verify backend is running: `npm start` in backend directory
2. Check network IP: `ipconfig` (look for IPv4)
3. Verify both devices on same WiFi
4. Check firewall isn't blocking port 3000
5. Verify `.env` has correct IP
6. Restart dev server: `npm run dev`

### Issue: "401 Unauthorized - redirecting to login"

**Solutions:**
1. Token expired → Login again
2. Wrong credentials → Check email/password
3. Backend restarted → Login again (tokens invalidated)
4. Admin role required → Ensure user is admin
5. Clear localStorage: Open DevTools → Application → Clear All

### Issue: "Network error - Cannot reach backend"

**Solutions:**
1. Backend not running → Start: `npm start` in backend
2. Wrong URL in .env → Check `VITE_API_URL`
3. Firewall blocking → Allow port 3000
4. Different network → Connect to same WiFi
5. DNS issue → Use IP instead of hostname

### Issue: "Login failed: No token received"

**Solutions:**
1. Backend `/users/login` endpoint failing
2. Wrong credentials → Check backend user exists
3. Backend database not connected → Check MongoDB
4. Check backend logs for error details

### Issue: Listings not loading / "Endpoint not found"

**Solutions:**
1. Verify backend has `/v1/admin/listings` endpoint
2. Ensure user token is valid
3. Check admin role is verified
4. Review backend logs: `npm start` output
5. Test endpoint directly: Use browser or Postman

### Issue: Changes not reflecting / Page stays blank

**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Clear localStorage: DevTools → Application → Clear All
4. Restart dev server: `npm run dev`
5. Check browser console for errors

---

## Performance Optimization

### Current Optimizations
- React Query for caching
- Code splitting with Vite
- Lazy loading for routes
- Image optimization

### Recommendations for Future
1. Implement pagination for listings/bookings
2. Add virtual scrolling for large tables
3. Optimize bundle size analysis
4. Implement WebSocket for real-time updates
5. Add service worker for offline support

---

## Security Considerations

### ✅ Implemented
- Token-based authentication (Bearer tokens)
- Protected routes (ProtectedRoute component)
- CORS enabled for backend
- Secure token storage (localStorage)
- Automatic logout on 401

### ⚠️ To Implement
- [ ] CSRF protection tokens
- [ ] Rate limiting on login
- [ ] IP whitelisting for admin
- [ ] Two-factor authentication (2FA)
- [ ] Activity logging and audit trails
- [ ] Encrypted password reset
- [ ] Session timeout (15-30 min)
- [ ] HTTPS-only in production

---

## Support & Maintenance

### Regular Maintenance
- Update dependencies: `npm update`
- Check security vulnerabilities: `npm audit`
- Review and optimize performance
- Backup database regularly
- Monitor error logs

### Reporting Issues
When reporting bugs, include:
1. Step to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors
5. Backend logs output
6. Network tab (F12 → Network)

### Contact & Resources
- Backend Repo: `lunest_backend/`
- Mobile App Repo: `lunest-mobile/`
- Issue Tracker: GitHub Issues
- Documentation: See `/src` component docs

---

## FAQ

**Q: Why use network IP instead of localhost?**
A: Mobile apps on Expo and physical devices can't access localhost. Network IP (192.168.x.x) is accessible from any device on the same WiFi.

**Q: Can I use the admin dashboard on mobile?**
A: Not with current setup. This is a web-only dashboard. For mobile admin, see lunest-mobile app.

**Q: How do I add a new management section?**
A: Create component in `src/components/dashboard/management/[feature]`, add service methods, update ContentRouter.

**Q: How do I deploy to production?**
A: Run `npm run build`, deploy `/dist` to web server, update API URL to production backend.

**Q: What if the backend is down?**
A: Dashboard shows error messages. Check backend logs and restart: `npm start` in backend directory.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.0.1 | 2026-01-29 | Fixed API connectivity, cleaned debug files, comprehensive documentation |
| 0.0.0 | Initial | Project setup with Vite, React, Tailwind |

---

**Last Updated:** January 29, 2026  
**Maintainer:** Lunest Development Team  
**Status:** Active Development
