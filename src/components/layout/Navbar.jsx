import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationDropdown from './NotificationDropdown'
import LogoutModal from './LogoutModal'

const Navbar = ({ activeMenu = 'Dashboard' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()

  // Load admin user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setAdminUser(userData)
      } catch (e) {
        console.error('Error parsing admin user data:', e)
      }
    }
  }, [])

  // Get display name and role from admin user data
  const displayName = adminUser?.fullName || 'Admin User'
  const displayRole = adminUser?.userType?.toLowerCase() || 'admin'
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
    'Promotions': {
      title: 'Promotions',
      description: 'Create and manage promotional campaigns.'
    },
    'Support': {
      title: 'Support Center',
      description: 'View and manage user support tickets and inquiries.'
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
    }
  };

  const currentPage = pageContent[activeMenu] || pageContent['Dashboard'];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-gray-50 border-b-[0.50px] border-slate-200">
      {/* Main Navbar Container - Flex with space between */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left Section - Page Content */}
        <div className="inline-flex flex-col justify-start items-start gap-1 flex-1 min-w-0">
          <div className="text-indigo-900 text-xl sm:text-2xl font-bold font-aeonik truncate">{currentPage.title}</div>
          <div className="text-slate-400 text-xs sm:text-sm font-medium font-aeonik truncate">{currentPage.description}</div>
        </div>

        {/* Right Section - Search, Notification, Profile */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
          
          {/* Search Bar */}
          <div className="inline-flex flex-1 sm:flex-none sm:w-80 h-10 px-4 py-2 bg-white rounded-[30px] justify-start items-center gap-2.5 shadow-sm">
            <div className="w-4 h-4 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10.5" cy="10.5" r="7.5" stroke="currentColor" strokeWidth="2" className="text-slate-900"/>
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-400"/>
              </svg>
            </div>
            <input type="text" placeholder="Search" className="text-slate-400 text-sm font-medium font-aeonik bg-transparent outline-none flex-1 min-w-0" />
          </div>
          
          {/* Notification Dropdown */}
          <NotificationDropdown />
          
          {/* Profile Section with Dropdown */}
          <div className="relative inline-flex flex-shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center justify-between gap-3 px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Profile Avatar */}
              <div className="w-10 h-10 relative flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{initials}</span>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white" />
              </div>

              {/* Profile Info - Hide on mobile */}
              <div className="hidden sm:flex flex-col justify-start items-start">
                <div className="justify-start text-slate-900 text-sm font-medium font-aeonik">{displayName}</div>
                <div className="justify-start text-stone-300 text-xs font-medium font-aeonik capitalize">{displayRole}</div>
              </div>

              {/* Dropdown Chevron */}
              <svg className={`w-5 h-5 text-slate-600 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-[10px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.30)] z-50">
                {/* Role Header */}
                <div className="px-5 py-3 border-b-[0.50px] border-slate-200">
                  <div className="text-slate-900 text-sm font-semibold font-aeonik capitalize">{displayRole}</div>
                  <div className="text-slate-400 text-xs font-medium font-aeonik truncate">{adminUser?.emailAddress || ''}</div>
                </div>

                {/* Menu Items */}
                <button className="w-full px-5 py-3 border-b-[0.50px] border-slate-200 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer text-left">
                  <div className="w-4 h-4 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-neutral-700 text-sm font-medium font-aeonik">View Profile</span>
                </button>

                <button className="w-full px-5 py-3 border-b-[0.50px] border-slate-200 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer text-left">
                  <div className="w-4 h-4 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-neutral-700 text-sm font-medium font-aeonik">Activity Log</span>
                </button>

                {/* Divider */}
                <div className="h-[0.50px] bg-slate-200"></div>

                {/* Sign Out */}
                <button 
                  onClick={() => {
                    setShowLogoutModal(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors cursor-pointer text-left">
                  <div className="w-4 h-4 flex-shrink-0 text-red-600">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m0 0a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-red-600 text-sm font-medium font-aeonik">Sign out</span>
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
    </div>
  )
}

export default Navbar