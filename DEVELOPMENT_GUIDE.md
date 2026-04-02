# Lunest Admin Dashboard - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser

### Installation

```bash
cd "c:\Users\AkintayoPC\Documents\Lunest Admin Dashboard\lunest-admin"

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Running the App

### Development
```bash
npm run dev
# Opens at http://localhost:5173
```

### Build for Production
```bash
npm run build
# Creates optimized build in dist/ folder
```

### Preview Production Build
```bash
npm run preview
```

---

## Project Structure

```
lunest-admin/
├── src/
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   ├── App.css              # Global styles
│   ├── index.css            # Base styles
│   ├── api/                 # API clients
│   │   ├── api.js
│   │   └── client.js
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── ui/              # Reusable UI
│   │   ├── ProtectedRoute.jsx
│   │   └── AllIcons.jsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── Settings.jsx
│   ├── services/
│   │   └── adminService.js  # Admin API service
│   └── styles/              # Stylesheets
│       └── fonts.css
├── public/                  # Static assets
│   ├── assets/
│   │   ├── icons/
│   │   ├── lucide/
│   │   └── vuesax/
│   └── fonts/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

---

## Key Features

### Dashboard
- Overview statistics
- Alerts and notifications
- Quick actions
- Performance metrics

### Listing Management
- View all listings
- Approve/Reject listings
- Edit listing details
- Filter and search
- Bulk actions
- Suspend/Reactivate

### User Management
- View users
- Approve host applications
- Ban users
- Flag suspicious accounts
- View user details

### Booking Management
- View all bookings
- Apply penalties
- Process refunds
- Add notes to bookings
- Track booking status

### KYC Verification
- Review KYC submissions
- Approve/Reject applications
- Request resubmission
- View verification details

---

## Environment Setup

### API Configuration
Set backend URL in `api/client.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';
// or with ngrok tunnel:
// const API_BASE_URL = 'https://xxxx-xx-xxx-xxx.ngrok.io';
```

### Authentication
- Login credentials provided by backend
- Sessions stored in localStorage
- JWT tokens for API requests

---

## Component Guide

### Dashboard Components

#### ListingManagement
Handles all listing approval/rejection workflows

```jsx
<ListingManagement />
```

**Features:**
- List all listings with status
- Filter by status, category, price range
- Approve/Reject individual listings
- Mass approval modal
- Edit listing details
- Suspend listings

#### UsersManagement
Manages user accounts and host applications

```jsx
<UsersManagement />
```

**Features:**
- View all users
- Approve/Reject host applications
- Ban users
- Flag accounts
- View application details

#### BookingManagement
Track and manage all bookings

```jsx
<BookingManagement />
```

**Features:**
- List all bookings
- Filter by status
- Apply penalties
- Process refunds
- Add notes
- View booking details

#### KYCVerification
Handle identity verification

```jsx
<KYCVerification />
```

**Features:**
- Review KYC submissions
- Approve/Reject
- Request resubmission
- View documents

---

## Styling

### Tailwind CSS
All styling uses Tailwind CSS utility classes.

```jsx
// Example
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

### Color Scheme
- Primary: Blue (#2563EB)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Danger: Red (#EF4444)
- Gray: (#6B7280, #9CA3AF, #D1D5DB)

---

## Icons

### Vuesax Icons
Linear and outline icon sets available.

```jsx
import VuesaxIcon from '@/public/assets/vuesax/linear/icon-name';

<img src={VuesaxIcon} alt="icon" className="w-5 h-5" />
```

### Lucide Icons
React-based icon library.

```jsx
import { Icon } from 'lucide-react';

<Icon className="w-5 h-5" />
```

---

## API Integration

### AdminService
Main service for API calls.

```javascript
import { adminService } from '@/services/adminService';

// Get listings
const listings = await adminService.getListings(filters);

// Approve listing
await adminService.approveListing(listingId);

// Reject listing
await adminService.rejectListing(listingId, reason);
```

### Error Handling
```javascript
try {
  await adminService.action();
} catch (error) {
  console.error('Action failed:', error);
  showErrorNotification(error.message);
}
```

---

## Common Tasks

### Add New Page
1. Create component in `pages/`
2. Add route in router
3. Add navigation link in Sidebar

### Add New Modal
1. Create modal component
2. Import in parent
3. Manage state with useState
4. Handle form submission

### Add New API Endpoint
1. Add method in `adminService.js`
2. Call from component
3. Handle loading/error states
4. Show notification on completion

---

## Performance Optimization

1. **Code Splitting** - Use React.lazy for route-based splitting
2. **Memoization** - Use React.memo for expensive renders
3. **Image Optimization** - Optimize images before use
4. **Caching** - Implement request caching in API client

---

## Testing

### Manual Testing Checklist
- [ ] Login flow
- [ ] Logout flow
- [ ] List all resources (listings, users, bookings)
- [ ] Filter/search functionality
- [ ] CRUD operations (Create, Read, Update, Delete)
- [ ] Error handling
- [ ] Notification display
- [ ] Responsive design

---

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Server
```bash
# Copy dist/ folder to your web server
scp -r dist/* user@server:/var/www/admin
```

### Deploy to Azure Static Web Apps
```bash
# Login to Azure
az login

# Deploy
az staticwebapp deploy --name lunest-admin
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clean build
npm run build

# Check for syntax errors
npx eslint src/
```

---

## Git Workflow

### Commit Changes
```bash
git add .
git commit -m "Feature: Add listing approval modal"
git push origin feature-branch
```

### Branch Naming
- `feature/description`
- `fix/description`
- `refactor/description`

---

## Documentation Files

- `DEVELOPMENT_GUIDE.md` - This file
- `README.md` - Project overview
- `package.json` - Dependencies

---

## Useful Commands

```bash
# Development
npm run dev         # Start dev server
npm run build       # Production build
npm run preview     # Preview build

# Linting
npm run lint        # Check code style

# Security
npm audit          # Check vulnerabilities
```

---

## Support & Resources

### Official Docs
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release |

---

**Last Updated:** January 29, 2026  
**Maintained By:** Development Team

