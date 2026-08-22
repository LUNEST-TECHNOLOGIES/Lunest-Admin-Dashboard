import React, { useState } from 'react'
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowDown } from 'react-icons/md'
import {
  DashboardIcon,
  ManagementIcon,
  FinanceIcon,
  PromotionsIcon,
  SupportIcon,
  SubscriptionIcon,
  SettingsIcon,
  ModerationIcon,
  MessagesIcon,
  AuditIcon,
  ProfileIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoOpenIcon,
  LogoCollapsedIcon,
  SidebarIcons,
} from '../AllIcons'

import { getCurrentUser, logoutUser } from '../../services/adminService';
import LogoutModal from './LogoutModal';

const Sidebar = ({ activeMenu = 'Dashboard', onMenuSelect = () => {}, isMobileOpen = false, setIsMobileOpen = () => {} }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const menuItems = [
    { label: 'Dashboard', iconComponent: DashboardIcon },
    { 
      label: 'Management', 
      iconComponent: ManagementIcon, 
      submenu: [
        { label: 'Listing Management', icon: '📋' },
        { label: 'Booking Management', icon: '📅' },
        { label: 'Users', icon: '👥' },
        { label: 'KYC Verification', icon: '🆔' },
        { label: 'Admin Management', icon: '⚙️' }
      ]
    },
    { 
      label: 'Finance & Growth', 
      iconComponent: FinanceIcon, 
      submenu: [
        { label: 'Financial Management', icon: '💰' },
        { label: 'Referrals and Reward', icon: '🎁' },
        { label: 'Coupon Management', icon: '🎟️' }
      ]
    },
    { label: 'Promotions', iconComponent: PromotionsIcon },
    { 
      label: 'Support', 
      iconComponent: SupportIcon,
      submenu: [
        { label: 'Support Center', icon: '🎧' },
        { label: 'Disputes & Report', icon: '⚖️' }
      ]
    },
    { label: 'Subscription Manager', iconComponent: SubscriptionIcon },
    { label: 'Settings & Controls', iconComponent: SettingsIcon },
    { label: 'Content Moderation', iconComponent: ModerationIcon },
    { label: 'Messages Oversight', iconComponent: MessagesIcon },
    { label: 'Audit Logs', iconComponent: AuditIcon },
    { label: 'System Health', iconComponent: ProfileIcon, superAdminOnly: true },
  ]
  
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.userType === 'SUPERADMIN';

  const filteredMenuItems = menuItems.map(item => {
    if (item.label === 'Management') {
        return {
            ...item,
            submenu: item.submenu.filter(sub => {
                if (sub.label === 'Admin Management') return isSuperAdmin;
                return true;
            })
        };
    }
    // Hide System Health from non-superadmins
    if (item.superAdminOnly && !isSuperAdmin) {
      return null;
    }
    return item;
  }).filter(Boolean);

  const handleSelect = (label) => {
    onMenuSelect(label);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        isOpen ? 'w-72' : 'w-20'
      } min-h-screen bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between shadow-xl lg:shadow-none`}>
        
        {/* Header */}
        <div className="border-b border-slate-100 py-4 px-3.5 flex flex-col gap-2">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between h-9 flex-shrink-0">
            <div className={`flex items-center transition-all ${isOpen ? 'justify-start pl-1' : 'justify-center w-full'}`}>
              {isOpen ? (
                <LogoOpenIcon />
              ) : (
                <LogoCollapsedIcon />
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            {isOpen && (
              <button
                onClick={() => {
                  setIsOpen(!isOpen)
                  setExpandedSubmenu(null)
                }}
                className="hidden lg:flex w-7 h-7 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer items-center justify-center"
                title="Collapse Sidebar"
              >
                <ChevronLeftIcon />
              </button>
            )}
          </div>

          {!isOpen && (
            <button
              onClick={() => {
                setIsOpen(true)
              }}
              className="hidden lg:flex w-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer items-center justify-center mt-1"
              title="Expand Sidebar"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
        
        {/* Navigation Menu */}
        <div className={`flex-1 py-4 px-3 overflow-y-auto scrollbar-hide`}>
          <nav className="flex flex-col gap-1.5">
            {filteredMenuItems.map((item, idx) => {
              const IconComponent = item.iconComponent
              const hasSubmenu = item.submenu && item.submenu.length > 0
              const isSubmenuOpen = expandedSubmenu === item.label
              
              const isMenuActive = item.label === activeMenu || 
                (hasSubmenu && item.submenu.some(sub => sub.label === activeMenu))

              return (
                <div key={idx} className="relative group">
                  {/* Main Menu Item */}
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        setExpandedSubmenu(isSubmenuOpen ? null : item.label)
                      } else {
                        handleSelect(item.label)
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-full text-left font-aeonik text-xs font-bold ${
                      isMenuActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    } ${isOpen ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                        isMenuActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                      }`}>
                        <IconComponent />
                      </div>
                      {isOpen && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    
                    {/* Submenu Chevron */}
                    {hasSubmenu && isOpen && (
                      <div className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}>
                        <MdOutlineKeyboardArrowDown className={`w-4 h-4 ${isMenuActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                      </div>
                    )}
                  </button>

                  {/* Inline Submenu (Expanded Sidebar) */}
                  {hasSubmenu && isSubmenuOpen && isOpen && (
                    <div className="mt-1 ml-4 pl-3.5 border-l-2 border-slate-100 space-y-1 animate-in fade-in duration-150">
                      {item.submenu.map((subitem, subIdx) => {
                        const isSubActive = activeMenu === subitem.label;
                        return (
                          <button
                            key={subIdx}
                            onClick={() => handleSelect(subitem.label)}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer w-full text-left text-xs font-aeonik ${
                              isSubActive
                                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="text-sm">{subitem.icon}</span>
                            <span className="truncate">{subitem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Submenu (Collapsed Sidebar) */}
                  {hasSubmenu && isSubmenuOpen && !isOpen && (
                    <div className="absolute left-full top-0 ml-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                      </div>
                      <div className="px-1.5 space-y-0.5">
                        {item.submenu.map((subitem, subIdx) => (
                          <button
                            key={subIdx}
                            onClick={() => {
                              handleSelect(subitem.label)
                              setExpandedSubmenu(null)
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer w-full text-left text-xs font-aeonik ${
                              activeMenu === subitem.label
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <span className="w-5 text-sm">{subitem.icon}</span>
                            <span>{subitem.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-100 p-3 flex flex-col gap-1.5">
          {/* Tooltip/Info Box */}
          {isOpen && (
            <div className="p-3 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl mb-1 shadow-xs">
              <p className="text-slate-200 text-[11px] font-medium font-aeonik leading-relaxed">
                💡 <span className="font-bold text-white">LUNEST Admin</span> • Real-time platform management &amp; escrow controls.
              </p>
            </div>
          )}
          
          {/* Profile Button */}
          <button 
            onClick={() => handleSelect('Profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-full text-left font-aeonik text-xs font-bold ${
              activeMenu === 'Profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            } ${isOpen ? '' : 'justify-center'}`}
          >
            <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${
              activeMenu === 'Profile' ? 'text-white' : 'text-slate-400'
            }`}>
              <ProfileIcon />
            </div>
            {isOpen && <span className="truncate">Profile</span>}
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 text-slate-400 cursor-pointer w-full text-left font-aeonik text-xs font-bold ${
              isOpen ? '' : 'justify-center'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-current">
              <LogoutIcon />
            </div>
            {isOpen && <span className="truncate">Logout</span>}
          </button>
        </div>

        <LogoutModal 
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={async () => {
            try {
              await logoutUser();
              window.location.href = '/login';
            } catch (err) {
              console.error('Logout failed:', err);
              localStorage.removeItem('authToken');
              window.location.href = '/login';
            }
          }}
        />
      </aside>
    </>
  )
}

export default Sidebar