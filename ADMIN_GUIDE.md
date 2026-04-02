# Lunest Admin Dashboard - Complete Master Guide

**Version:** 1.0 (Production-Ready)  
**Last Updated:** April 2, 2026  
**Status:** Unified Source of Truth

---

## 📋 Table of Contents
1. [Project Overview & Tech Stack](#project-overview--tech-stack)
2. [Getting Started (Developer Setup)](#getting-started-developer-setup)
3. [Architecture & Infrastructure](#architecture--infrastructure)
4. [User Management & Host Verification](#user-management--host-verification)
5. [Listing Lifecycle & Moderation](#listing-lifecycle--moderation)
6. [Financial Systems & Reporting](#financial-systems--reporting)
7. [KYC Verification Flow](#kyc-verification-flow)
8. [Compliance & Data Protection (GDPR/AML)](#compliance--data-protection)
9. [Documentation Fixes & Debugging Log](#documentation-fixes--debugging-log)
10. [Troubleshooting & FAQ](#troubleshooting--faq)
11. [Deployment & Production Requirements](#deployment--production-requirements)

---

## 1. Project Overview & Tech Stack

**Lunest Admin Dashboard** is the centralized control panel for managing the Lunest property rental platform. It provides administrators with oversight of users, hosts, listings, and financial transactions.

### Core Stack
- **Frontend**: React 19.2 + Vite 7.2
- **Styling**: Tailwind CSS 4.1 + Vanilla CSS
- **HTTP Client**: Axios 1.13 (with automatic Bearer token injection)
- **Routing**: React Router DOM 7.12
- **State Management**: React Hooks + React Query 5.90
- **Backend Architecture**: Node.js + Express + TypeScript + MongoDB (at `:3000`)

---

## 2. Getting Started (Developer Setup)

### Prerequisites
- **Node.js**: v18 LTS (Recommended)
- **Local Network**: Backend and Dashboard must share the same network for IP-based communication.

### Installation & Run
```bash
# 1. Install Dependencies
npm install

# 2. Configure Environment (.env)
VITE_API_URL=http://192.168.0.200:3000/v1

# 3. Start Development Server
npm run dev
```

### Access Points
- **Local**: `http://localhost:5174`
- **Network (Mobile/Tablets)**: `http://192.168.0.200:5174`
- **Demo Admin**: `admin@lunest.com` / `admin123`

---

## 3. Architecture & Infrastructure

### Directory Structure
```
lunest-admin/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Management modules (Listings, Users, KYC)
│   │   ├── layout/          # Sidebar, Navbar
│   │   └── ui/              # Global Modals, Notifications
│   ├── pages/               # Top-level Routing (Login, Dashboard, Settings)
│   ├── services/            # adminService.js (API Layer)
│   └── api/                 # client.js (Axios Configuration)
├── .env                     # Environment Config
└── vite.config.js           # Server & Proxy Config
```

### Authentication Flow
1. **Login**: POST to `/users/login` returns a JWT.
2. **Storage**: Token saved in `localStorage.authToken`.
3. **Persistence**: `ProtectedRoute` checks for token presence before allowing access.
4. **Injection**: `src/api/client.js` automatically attaches the token to the `Authorization: Bearer <token>` header.

---

## 4. User Management & Host Verification

Administrators have granular control over user accounts and the host onboarding process.

### Features
- **User Auditing**: View profile details, verification status, and booking history.
- **Banning/Suspension**: Toggle user status with an administrative reason.
- **Host Applications**: 
    - Review uploaded IDs and property documentation.
    - Approve/Reject applications (automatically notifies user via email).
    - Automatic award of referral points upon approval.

---

## 5. Listing Lifecycle & Moderation

Listings undergo a rigorous moderation process to ensure platform quality.

### Listing Statuses
- `PENDING`: Waiting for admin review.
- `AVAILABLE`: Approved and visible to guests.
- `REJECTED`: Declined with reason.
- `SUSPENDED`: Hidden due to policy violations.

### Admin Actions
- **Mass Approval**: Approve multiple listings at once for efficiency.
- **Cascading Deletion**: Deleting a listing removes all associated bookings and metadata.

---

## 6. Financial Systems & Reporting

Built for transparency, the financial module tracks every Naira flowing through the platform.

### Key Metrics Fixes (April 2026)
- **Coupon Aggregation**: "Total Discount Used" is now calculated by summing actual records in `usageHistory.amount` rather than nominal face values.
- **Tax Splitting**: Payments are split into Rent, App Fee, VAT, and Caution Fee at the database level for granular auditing.

---

## 7. KYC Verification Flow

Uses **Korapay** and **Termii** for identity and contact verification.

1. **NIN Verification**: Cross-references Nigerian National Identity Number with official records.
2. **Face Matching**: Compares user selfies against NIN database images (Sandbox only).
3. **Phone Verification**: 6-digit OTP sent via Termii generic channel.
4. **Status**: Verified users gain the "Blue Badge" and eligibility to become Hosts.

---

## 8. Compliance & Data Protection (GDPR/AML)

### Administrative Audit Trail
Every sensitive administrative action is logged to the `admin_activity_logs` collection:
- **Who**: Admin ID and Email.
- **What**: Action (e.g., `USER_BAN`, `LISTING_APPROVE`).
- **Target**: Entity ID (User, Listing, Booking).
- **Metadata**: Old vs New values, IP Address, User Agent.

### Data Privacy
- **Encryption at Rest**: Sensitive PII (NIN, Phone) is prioritized for future AES-256 encryption.
- **DSAR Policy**: Implementation of Data Subject Access Requests (JSON export) is in progress.

---

## 9. Documentation Fixes & Debugging Log

### Recent Resolutions
1. **Network Connectivity**: Fixed hardcoded `localhost` issues by moving to network-wide IP (`192.168.0.200`).
2. **Avatar Timeouts**: Increased Axios timeout to 30s to handle large image uploads.
3. **Coupon Rendering**: Fixed bug where "n/a" was displayed instead of total savings.

---

## 10. Troubleshooting & FAQ

### Dashboard is Blank?
- **Root Cause**: Backend usually not running on `:3000`.
- **Fix**: Run `npm start` in the backend directory.

### "Unauthorized" error after login?
- **Fix**: Clear browser cache or run `localStorage.clear()` in console.

---

## 11. Deployment & Production Requirements

### Build Process
```bash
npm run build
# Output goes to /dist directory
```

### Production Checklist
- [ ] HTTPS/SSL Certificates active.
- [ ] API Rate Limiting enabled on backend.
- [ ] `VITE_API_URL` updated to production endpoint.
- [ ] CORS policies restricted to production domain.

---
© 2026 Lunest Technologies. All Rights Reserved.
