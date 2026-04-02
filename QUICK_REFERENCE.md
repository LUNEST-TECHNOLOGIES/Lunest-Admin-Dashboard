# Lunest Admin Dashboard - Quick Reference & Suggested Fixes

**Last Updated:** January 29, 2026

---

## 🎯 Quick Start

### Start Development Server
```bash
cd "c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin"
npm install  # First time only
npm run dev
```

### Access Dashboard
- **Local:** http://localhost:5174
- **Network:** http://192.168.0.200:5174
- **Default Admin:** admin@lunest.com / admin123

---

## 📊 System Status

| Component | Status | Details |
|-----------|--------|---------|
| Vite Dev Server | ✅ Running | Port 5174, all interfaces |
| API Configuration | ✅ Fixed | Using 192.168.0.200:3000 |
| Authentication | ✅ Working | Bearer tokens implemented |
| Protected Routes | ✅ Working | Login wall in place |
| Database Connection | ⏳ Depends | MongoDB must be running |

---

## 🔧 Recent Fixes (Jan 29, 2026)

### Critical Fixes Applied
1. ✅ **Network IP Configuration** - Changed from `localhost` to `192.168.0.200`
2. ✅ **Vite Server Listening** - Added `host: '0.0.0.0'` to listen on all interfaces
3. ✅ **Proxy Configuration** - Updated to use network IP
4. ✅ **API Client Fallback** - Changed hardcoded localhost to network IP
5. ✅ **Cleanup** - Removed 3 outdated debug documentation files

### Files Modified
```
.env                    → VITE_API_URL updated
vite.config.js          → server.host & proxy updated
src/api/client.js       → Fallback URL updated
```

### Files Deleted
```
LISTING_FETCH_FIX.md
LISTING_FETCH_QUICK_REF.md
LISTING_MANAGEMENT_FIX_SUMMARY.md
```

---

## 📋 Current Configuration

### .env Settings
```env
VITE_API_URL=http://192.168.0.200:3000/v1
```

### Vite Server Settings
```javascript
server: {
  host: '0.0.0.0',
  port: 5174,
  proxy: {
    '/v1': {
      target: 'http://192.168.0.200:3000',
      changeOrigin: true,
      logLevel: 'debug',
    }
  }
}
```

### API Client Settings
```javascript
// Uses VITE_API_URL from .env
// Falls back to http://192.168.0.200:3000/v1
// Adds Bearer token to all requests
// Retries network errors 2 times
// Redirects to /login on 401
```

---

## 🐛 Troubleshooting

### "Cannot reach backend"
```bash
# 1. Check backend is running
cd "c:\Users\AkintayoPC\Documents\ReactApp\lunest back\lunest_backend"
npm start

# 2. Verify IP address
ipconfig | findstr IPv4

# 3. Verify connection
curl http://192.168.0.200:3000/health

# 4. Check .env file
cat .env

# 5. Restart dev server
npm run dev
```

### "Login failed - 404"
- Backend `/users/login` endpoint issue
- Verify backend is running
- Check MongoDB is connected
- Review backend logs

### "Page stays blank"
- Press Ctrl+Shift+R (hard refresh)
- Check browser console (F12)
- Clear localStorage
- Restart dev server

### "Not accessible from network"
- Ensure same WiFi network
- Check firewall allows port 5174
- Verify `server.host: '0.0.0.0'` in vite.config.js
- Try direct IP: `http://192.168.0.200:5174`

---

## 📚 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/services/adminService.js` | API calls | ✅ Good |
| `src/api/client.js` | Axios config | ✅ Good |
| `src/pages/Login.jsx` | Authentication | ✅ Good |
| `src/components/ProtectedRoute.jsx` | Route protection | ✅ Good |
| `src/pages/Dashboard.jsx` | Main dashboard | ✅ Good |
| `.env` | Environment config | ✅ Fixed |
| `vite.config.js` | Vite settings | ✅ Fixed |

---

## 🚀 Deployment

### Development Deployment
```bash
npm run dev
# Access at http://192.168.0.200:5174
```

### Production Build
```bash
npm run build
# Output: ./dist (ready for deployment)
```

### Production Deployment
```bash
# 1. Build
npm run build

# 2. Deploy dist/ to web server
# 3. Configure HTTPS
# 4. Update backend URL to production
# 5. Set CORS headers
```

---

## 🔒 Security Checklist

### ✅ Implemented
- [x] Bearer token authentication
- [x] Protected routes
- [x] Auto logout on 401
- [x] Error message handling
- [x] CORS enabled

### ⚠️ To Implement (Production)
- [ ] HTTPS/SSL
- [ ] Session timeout (15-30 min)
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging
- [ ] IP whitelisting
- [ ] 2FA for admins

---

## 📈 Performance Tips

### Current Optimizations
- React Query caching
- Code splitting with Vite
- CSS minification with Tailwind
- Network request batching

### Optimization Opportunities
1. Add pagination for listings
2. Implement virtual scrolling
3. Analyze bundle size
4. Add service worker
5. Cache static assets longer

---

## 🔄 API Endpoints

### Available Endpoints
```
POST   /users/login                  Login
POST   /users/all                    Get users
PATCH  /users/:id                    Update user
POST   /users/:id/approve-host       Approve host
POST   /users/:id/reject-host        Reject host

POST   /admin/listings               Get listings
POST   /listings/:id/approve         Approve listing
POST   /listings/:id/reject          Reject listing
POST   /listings/:id/suspend         Suspend listing

POST   /bookings/all                 Get bookings
POST   /bookings/:id/approve         Approve booking

POST   /kyc/documents                Get KYC
POST   /kyc/:id/approve              Approve KYC
POST   /kyc/:id/reject               Reject KYC
```

---

## 📝 Suggested Fixes for Future

### Priority 1 (High)
- [ ] Add unit tests for services (Jest)
- [ ] Add E2E tests (Cypress/Playwright)
- [ ] Implement pagination for large tables
- [ ] Add error boundary component
- [ ] Session timeout implementation

### Priority 2 (Medium)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database migration scripts
- [ ] Backup and recovery procedures
- [ ] Rate limiting on backend
- [ ] Request caching optimization

### Priority 3 (Low)
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Analytics integration
- [ ] Real-time updates (WebSocket)
- [ ] Mobile app version

---

## 🎓 Developer Tips

### Running with Debug Logging
```bash
# Vite debug
DEBUG=* npm run dev

# Check env vars
node -e "console.log(process.env)"
```

### Testing API Calls
```javascript
// In browser console
const token = localStorage.getItem('authToken');
fetch('http://192.168.0.200:3000/v1/admin/listings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: '{}'
})
.then(r => r.json())
.then(console.log)
```

### Clear All Data
```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## 📖 Documentation Files

| File | Content |
|------|---------|
| `README.md` | Project overview |
| `DEVELOPMENT_GUIDE.md` | Developer guide |
| `ADMIN_DASHBOARD_DOCUMENTATION.md` | Complete documentation (NEW) |
| `FIXES_APPLIED.md` | Detailed fixes (NEW) |
| `QUICK_REFERENCE.md` | This file |

---

## 🤝 Backend Integration

### Backend Status
- **Location:** `c:\Users\AkintayoPC\Documents\ReactApp\lunest back\lunest_backend`
- **Tech:** Express.js + TypeScript
- **Database:** MongoDB
- **Port:** 3000

### To Start Backend
```bash
cd "c:\Users\AkintayoPC\Documents\ReactApp\lunest back\lunest_backend"
npm start
```

### Verify Backend
```bash
# Health check
curl http://192.168.0.200:3000/health

# Login test
curl -X POST http://192.168.0.200:3000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"emailAddress":"admin@lunest.com","password":"admin123"}'
```

---

## 💡 Key Concepts

### Why Network IP?
- **localhost** only works on local machine
- **192.168.0.200** accessible from any device on WiFi
- Needed for mobile testing and cross-device access

### Why `host: '0.0.0.0'`?
- Tells server to listen on all network interfaces
- Without it, only localhost:5174 works
- With it, localhost:5174 AND 192.168.0.200:5174 work

### Why Vite Proxy?
- Routes `/v1` requests to backend
- Handles CORS issues
- Useful during development
- Disabled in production (use reverse proxy)

---

## ✅ Verification Checklist

Before going to production:
- [ ] Backend running and accessible
- [ ] Login works with valid credentials
- [ ] Can access dashboard from network IP
- [ ] All management sections load data
- [ ] Approve/reject actions work
- [ ] Logout clears token
- [ ] Protected routes enforce login
- [ ] Error messages are helpful
- [ ] No console errors in browser
- [ ] API calls complete in <5 seconds

---

## 📞 Support

### Quick Diagnostics
1. Check `.env` has correct IP
2. Check `vite.config.js` has `host: '0.0.0.0'`
3. Verify backend is running
4. Verify both on same WiFi
5. Check firewall isn't blocking

### If Issues Persist
1. Check `ADMIN_DASHBOARD_DOCUMENTATION.md` → Troubleshooting
2. Review `FIXES_APPLIED.md` for context
3. Check backend logs
4. Check browser console (F12)
5. Check network tab (F12 → Network)

---

**Generated:** January 29, 2026  
**Version:** 1.0  
**Status:** Ready for Use
