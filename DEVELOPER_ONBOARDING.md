# Lunest Admin Dashboard - Developer Onboarding Guide

**For:** New developers joining the Lunest Admin team  
**Created:** January 29, 2026  
**Time to Complete:** 15-30 minutes

---

## Welcome! 👋

You're now part of the Lunest Admin Dashboard development team. This guide will get you up and running quickly.

---

## Step 1: Prerequisites (5 minutes)

### Install Required Tools

**Node.js & npm:**
```bash
# Check if installed
node --version    # Should be 16+ (18 LTS recommended)
npm --version     # Should be 8+

# If not installed, download from nodejs.org
```

**Git (Optional but recommended):**
```bash
git --version
# If not installed, download from git-scm.com
```

### System Requirements
- **OS:** Windows, macOS, or Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 2GB free space
- **Network:** WiFi access to same network as backend

---

## Step 2: Getting Started (5 minutes)

### Clone/Open the Project

```bash
# Navigate to admin dashboard
cd "c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin"

# Or on macOS/Linux:
cd ~/Documents/Lunest\ Admin\ Dashboard/lunest-admin
```

### Install Dependencies

```bash
# Install all dependencies (first time only)
npm install

# This takes 2-3 minutes, downloads 500+ packages
```

### Start Development Server

```bash
# Start the dev server
npm run dev

# Output:
#   ➜  Local:   http://localhost:5174
#   ➜  Network: http://192.168.0.200:5174
```

### Open in Browser

```
Visit: http://192.168.0.200:5174
Or:    http://localhost:5174
```

**Login with:**
- Email: `admin@lunest.com`
- Password: `admin123`

---

## Step 3: Understanding the Project Structure (5 minutes)

### Main Folders

```
src/
├── components/          # React components
│   ├── dashboard/       # Dashboard sections
│   ├── layout/          # Navbar, sidebar
│   └── ui/              # Modals, notifications
├── pages/               # Page components
│   ├── Login.jsx        # Login page
│   ├── Dashboard.jsx    # Main dashboard
│   └── Settings.jsx     # Admin settings
├── services/            # API calls
│   └── adminService.js  # All API methods
├── api/                 # HTTP configuration
│   └── client.js        # Axios setup
└── styles/              # CSS files
```

### Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/services/adminService.js` | API calls | Adding new endpoints |
| `src/api/client.js` | HTTP config | Changing auth method |
| `src/pages/Login.jsx` | Authentication | Changing login flow |
| `src/components/ProtectedRoute.jsx` | Route protection | Changing access control |
| `.env` | Configuration | Changing API URL |
| `vite.config.js` | Dev server | Dev environment changes |

---

## Step 4: Common Tasks (5 minutes)

### Task 1: Make an API Call

**Step 1:** Add method to `src/services/adminService.js`

```javascript
export const myNewAction = async (id, data) => {
    const response = await apiClient.post('/endpoint', { id, ...data });
    return response.data;
};
```

**Step 2:** Use in a component

```javascript
import { myNewAction } from '../services/adminService';

export default function MyComponent() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        myNewAction(123, { name: 'test' })
            .then(result => setData(result))
            .catch(err => console.error(err));
    }, []);
    
    return <div>{/* render data */}</div>;
}
```

### Task 2: Add a New Page

**Step 1:** Create component: `src/pages/MyPage.jsx`

```javascript
export default function MyPage() {
    return <div>My New Page</div>;
}
```

**Step 2:** Add route in `src/App.jsx`

```javascript
<Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

**Step 3:** Add navigation link in sidebar

### Task 3: Debug API Calls

```javascript
// In browser console (F12)

// Check auth token
localStorage.getItem('authToken')

// Test API call
fetch('http://192.168.0.200:3000/v1/admin/listings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  },
  body: '{}'
}).then(r => r.json()).then(console.log)
```

---

## Step 5: Important Configuration (5 minutes)

### Environment Variables (.env)

```env
# Current settings (don't change unless you know what you're doing)
VITE_API_URL=http://192.168.0.200:3000/v1
```

### What Each Setting Does

- `VITE_API_URL` - Backend API server address
  - **Local:** `http://localhost:3000/v1`
  - **Network:** `http://192.168.0.200:3000/v1`
  - **Production:** `https://api.lunest.com/v1`

### Dev Server Settings (vite.config.js)

```javascript
server: {
  host: '0.0.0.0',      // Listen on all interfaces
  port: 5174,            // Dev server port
  proxy: {               // Route /v1 to backend
    '/v1': { target: 'http://192.168.0.200:3000' }
  }
}
```

**Key Concept:** 
- `host: '0.0.0.0'` = accessible from any device on WiFi
- Without it, only localhost works
- Needed for testing on multiple devices

---

## Step 6: Development Workflow

### Daily Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Make code changes (auto-reload)
# 3. Test in browser
# 4. Check console for errors (F12)
# 5. Commit when done
git add .
git commit -m "Feature: add something"

# 6. Stop server when done
# Press Ctrl+C in terminal
```

### Testing Multiple Devices

**On Same Machine:**
- Open `http://localhost:5174` in Chrome
- Open `http://192.168.0.200:5174` in Firefox
- Both access same dev server

**On Different Device:**
- Get your machine's IP: `ipconfig | findstr IPv4`
- On other device, open `http://YOUR_IP:5174`
- Must be on same WiFi

### Debugging

```bash
# Check backend is running
curl http://192.168.0.200:3000/health

# Check dev server is running
curl http://localhost:5174

# View environment
npm run dev --verbose

# Check what changed
git status
git diff src/file.jsx
```

---

## Step 7: Common Issues & Solutions

### Issue: "Cannot reach backend"
```bash
# Solution 1: Check backend is running
cd ../lunest_backend
npm start

# Solution 2: Check IP address
ipconfig | findstr IPv4

# Solution 3: Verify in .env
# VITE_API_URL=http://YOUR_IP:3000/v1
```

### Issue: "Login doesn't work"
```bash
# Solution 1: Check credentials
# Default: admin@lunest.com / admin123

# Solution 2: Check backend logs
# Backend startup shows connection status

# Solution 3: Check browser console
# Press F12, look for error messages
```

### Issue: "Changes not showing up"
```bash
# Solution 1: Hard refresh
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Solution 2: Clear cache
localStorage.clear()
location.reload()

# Solution 3: Restart dev server
# Stop: Ctrl+C
# Start: npm run dev
```

### Issue: "Node modules issues"
```bash
# Solution: Reinstall dependencies
rm -r node_modules
npm install
npm run dev
```

---

## Step 8: Code Standards

### File Naming
```javascript
// Components: PascalCase
MyComponent.jsx      // ✅ Good
MyComponent.js       // ✅ Also OK
my-component.jsx     // ❌ Wrong

// Functions: camelCase
const myFunction = () => {}       // ✅ Good
const MyFunction = () => {}       // ❌ Wrong

// Constants: UPPER_SNAKE_CASE
const API_URL = 'http://...'      // ✅ Good
const apiUrl = 'http://...'       // ❌ Wrong
```

### React Component Structure
```javascript
// 1. Imports
import { useState, useEffect } from 'react';

// 2. Component
export default function MyComponent() {
    // 3. State
    const [data, setData] = useState(null);
    
    // 4. Effects
    useEffect(() => {
        // Load data
    }, []);
    
    // 5. Handlers
    const handleClick = () => {};
    
    // 6. Render
    return <div>content</div>;
}
```

### Error Handling
```javascript
// ✅ Good
try {
    const result = await apiClient.get('/endpoint');
    setData(result.data);
} catch (error) {
    console.error('Failed to load data:', error.message);
    setError(error.message);
}

// ❌ Bad
const result = await apiClient.get('/endpoint');
setData(result.data);  // No error handling
```

---

## Step 9: Documentation You Should Read

### Must Read (30 minutes)
1. `QUICK_REFERENCE.md` - Essential quick start
2. `ADMIN_DASHBOARD_DOCUMENTATION.md` - Complete guide

### Should Read (1 hour)
3. `FIXES_APPLIED.md` - What was fixed and why
4. `COMPREHENSIVE_AUDIT_REPORT.md` - Full analysis

### Reference (as needed)
5. `README.md` - Project overview
6. `DEVELOPMENT_GUIDE.md` - Development tips

---

## Step 10: Useful Commands

### Development
```bash
npm run dev         # Start dev server
npm run lint        # Check code style
npm run build       # Build for production
npm run preview     # Preview production build
```

### Debugging
```bash
# See what's in localStorage
localStorage

# Check environment
process.env

# Test API directly
fetch('http://192.168.0.200:3000/v1/admin/listings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  },
  body: '{}'
})
.then(r => r.json())
.then(console.log)
```

---

## Step 11: Git Workflow (Optional)

### Basic Commands
```bash
# Check status
git status

# Add changes
git add .
git add src/file.jsx  # Specific file

# Commit
git commit -m "Feature: description of change"

# Push
git push

# Pull latest
git pull

# View history
git log --oneline -10
```

### Commit Message Format
```
Feature: Add listing approval feature
Fix: Resolve login timeout issue
Refactor: Clean up API client code
Docs: Update API documentation
```

---

## Step 12: Next Steps

### Your First Day
- [x] Get project running
- [x] Log in to dashboard
- [x] Explore the UI
- [x] Read QUICK_REFERENCE.md
- [x] Understand file structure

### Your First Week
- [ ] Read complete documentation
- [ ] Make a small UI change
- [ ] Add one API call
- [ ] Fix a bug if available
- [ ] Deploy to test environment

### Your First Month
- [ ] Lead a feature implementation
- [ ] Review a teammate's code
- [ ] Write tests for your code
- [ ] Optimize a slow API call
- [ ] Document a new feature

---

## Contacts & Resources

### Documentation
- **Technical:** See files in repo root
- **API Reference:** `ADMIN_DASHBOARD_DOCUMENTATION.md` → API Integration
- **Troubleshooting:** `QUICK_REFERENCE.md` → Troubleshooting

### Development
- **Backend:** `c:\Users\AkintayoPC\Documents\ReactApp\lunest back\lunest_backend`
- **Mobile:** `c:\Users\AkintayoPC\Documents\Lunest_app\lunest-mobile`

### Support
1. Check documentation files
2. Ask team lead
3. Review similar code
4. Check browser console (F12)
5. Check backend logs

---

## Quick Checklist

Before starting your first feature:

- [ ] Node.js 16+ installed
- [ ] Project cloned/opened
- [ ] `npm install` completed
- [ ] `npm run dev` works
- [ ] Can access `http://192.168.0.200:5174`
- [ ] Can login with demo credentials
- [ ] Backend is running on port 3000
- [ ] Browser console open (F12)
- [ ] Read QUICK_REFERENCE.md
- [ ] Understand file structure

---

## You're All Set! 🚀

You now have everything you need to start developing. 

**Remember:**
- ✅ Code quality first
- ✅ Read before implementing
- ✅ Test thoroughly
- ✅ Ask for help when stuck
- ✅ Document your changes

**Happy coding!**

---

**Questions?** Check the documentation files or ask your team lead.

**Last Updated:** January 29, 2026  
**Version:** 1.0
