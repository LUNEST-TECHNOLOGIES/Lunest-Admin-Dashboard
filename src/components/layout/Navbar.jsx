import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationDropdown from './NotificationDropdown'
import LogoutModal from './LogoutModal'

const Navbar = ({ activeMenu = 'Dashboard', onMenuSelect, onToggleMobileMenu }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()

  // Load admin user data from localStorage on mount and listen to changes
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('adminUser')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setAdminUser(userData)
        } catch (e) {
          console.error('Error parsing admin user data:', e)
        }
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [])

  // Get display name and role from admin user data
  const displayName = adminUser?.fullName || 'Admin User'
  const displayRole = adminUser?.userType?.toLowerCase() || 'admin'
  const displayEmail = adminUser?.emailAddress && !adminUser.emailAddress.startsWith('det:') && !adminUser.emailAddress.includes(':') && adminUser.emailAddress.length < 55
    ? adminUser.emailAddress
    : (adminUser?.email || '');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Page content configuration
  const pageContent = {
    'Dashboard': {
      title: 'Admin Overview',
      description: 'Track platform activity, performance, and system alerts in real time.'
    },
    'Management': {
      title: 'Management',
      description: 'Manage users, listings, and platform operations.'
    },
    'Listing Management': {
      title: 'Listing Management',
      description: 'Manage all property listings on the platform.'
    },
    'Booking Management': {
      title: 'Booking Management',
      description: 'Manage bookings, reservations, and check-in/out processes.'
    },
    'Users': {
      title: 'Users',
      description: 'Manage users, hosts, and guests on the platform.'
    },
    'KYC Verification': {
      title: 'KYC Verification',
      description: 'Review and verify KYC submissions from users.'
    },
    'Admin Management': {
      title: 'Admin Management',
      description: 'Manage admin users, roles, and permissions.'
    },
    'Finance & Growth': {
      title: 'Finance & Growth',
      description: 'Monitor revenue, transactions, and growth metrics.'
    },
    'Financial Management': {
      title: 'Financial Management',
      description: 'Escrow reconciliation, transaction lifecycle, and fee ledgers.'
    },
    'Referrals and Reward': {
      title: 'Referrals & Rewards',
      description: 'Track referral growth, claims, and reward payouts.'
    },
    'Coupon Management': {
      title: 'Coupon Management',
      description: 'Issue and audit platform discount and promotional coupons.'
    },
    'Promotions': {
      title: 'Promotions',
      description: 'Create and manage promotional campaigns.'
    },
    'Support': {
      title: 'Support Center',
      description: 'View and manage user support tickets and inquiries.'
    },
    'Support Center': {
      title: 'Support Center',
      description: 'Customer service queries, live tickets, and support chat.'
    },
    'Disputes & Report': {
      title: 'Disputes & Reports',
      description: 'Arbitrate security deposit claims, cancellations, and user reports.'
    },
    'Subscription Manager': {
      title: 'Subscription Manager',
      description: 'Manage subscription plans and user subscriptions.'
    },
    'Settings & Controls': {
      title: 'Settings & Controls',
      description: 'Configure platform settings and access controls.'
    },
    'Content Moderation': {
      title: 'Content Moderation',
      description: 'Review and moderate platform content.'
    },
    'Messages Oversight': {
      title: 'Messages Oversight',
      description: 'Monitor and manage user communications.'
    },
    'Audit Logs': {
      title: 'Audit Logs',
      description: 'View platform activity and system logs.'
    },
    'System Health': {
      title: 'System Health & Metrics',
      description: 'Real-time database, API latency, and infrastructure status.'
    },
    'Profile': {
      title: 'Admin Profile',
      description: 'Manage administrative account credentials and security.'
    }
  };

  const currentPage = pageContent[activeMenu] || pageContent['Dashboard'];

  return (
    <header className="w-full px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
      {/* Main Navbar Container */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        
        {/* Left Section - Hamburger & Page Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0 shadow-xs"
            aria-label="Toggle Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col justify-start items-start min-w-0">
            <h1 className="text-slate-900 text-lg sm:text-xl font-bold font-aeonik tracking-tight truncate">
              {currentPage.title}
            </h1>
            <p className="text-slate-400 text-xs font-medium font-aeonik truncate hidden sm:block">
              {currentPage.description}
            </p>
          </div>
        </div>

        {/* Right Section - Search, Notification, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full lg:w-auto justify-end">
          
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-none sm:w-72 h-9 px-3 bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/80 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-xs">
            <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search reference, user..." 
              className="text-slate-800 text-xs font-medium font-aeonik bg-transparent outline-none flex-1 min-w-0 placeholder-slate-400" 
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>
          
          {/* Notification Dropdown */}
          <NotificationDropdown />
          
          {/* Profile Section with Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {/* Profile Avatar */}
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-xs">
                  <span className="text-white text-xs font-bold font-aeonik">{initials}</span>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
              </div>

              {/* Profile Info */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-slate-900 text-xs font-bold font-aeonik leading-tight truncate max-w-[110px]">
                  {displayName}
                </span>
                <span className="text-slate-400 text-[10px] font-medium font-aeonik capitalize leading-none mt-0.5">
                  {displayRole}
                </span>
              </div>

              {/* Dropdown Chevron */}
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5">
                {/* Role Header */}
                <div className="px-3.5 py-2.5 bg-slate-50/80 rounded-xl mb-1 border border-slate-100">
                  <div className="text-slate-900 text-xs font-bold font-aeonik capitalize">{displayRole}</div>
                  <div className="text-slate-400 text-[11px] font-medium font-aeonik truncate">{displayEmail}</div>
                </div>

                {/* Menu Items */}
                <button 
                  onClick={() => {
                    if (typeof onMenuSelect === 'function') onMenuSelect('Profile');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-left text-xs font-bold text-slate-700 font-aeonik"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                  </svg>
                  <span>View Profile</span>
                </button>

                <button 
                  onClick={() => {
                    if (typeof onMenuSelect === 'function') onMenuSelect('Audit Logs');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-left text-xs font-bold text-slate-700 font-aeonik"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" strokeLinecap="round"/>
                    <path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" strokeLinecap="round"/>
                  </svg>
                  <span>Activity Log</span>
                </button>

                <div className="h-[1px] bg-slate-100 my-1"></div>

                {/* Sign Out */}
                <button 
                  onClick={() => {
                    setShowLogoutModal(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left text-xs font-bold font-aeonik"
                >
                  <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m0 0a4 4 0 0 1 8 0" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('loginMessage');
          localStorage.removeItem('adminUser');
          setShowLogoutModal(false);
          navigate('/login');
        }}
      />
    </header>
  )
}

export default Navbar