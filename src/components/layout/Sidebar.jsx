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

import { getCurrentUser } from '../../services/adminService';

const Sidebar = ({ activeMenu = 'Dashboard', onMenuSelect = () => {} }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)

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
    return item;
  });

  return (
    <div className={`transition-all duration-300 ease-in-out ${
      isOpen ? 'w-72' : 'w-20'
    } min-h-screen bg-gray-50 border-r-[0.50px] border-slate-200 flex flex-col justify-between overflow-hidden`}>
      
      {/* Header */}
      <div className="border-b-[0.50px] border-slate-200 py-4 px-2.5">
        {/* Logo */}
        <div className="flex items-center justify-center h-8 flex-shrink-0 mb-3">
          {isOpen ? (
            <LogoOpenIcon />
          ) : (
            <LogoCollapsedIcon />
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer text-slate-600 flex items-center justify-center"
        >
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </div>
      
      {/* Navigation Menu */}
      <div className="flex-1 py-6 px-2.5 overflow-y-auto">
        <nav className="flex flex-col gap-3">
          {filteredMenuItems.map((item, idx) => {
            const IconComponent = item.iconComponent
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isSubmenuOpen = expandedSubmenu === item.label
            
            // Check if this menu or any of its submenus are active
            const isMenuActive = item.label === activeMenu || 
              (hasSubmenu && item.submenu.some(sub => sub.label === activeMenu))

            return (
              <div key={idx}>
                {/* Main Menu Item */}
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      // If clicking on a parent with submenu, toggle it and auto-expand
                      setExpandedSubmenu(isSubmenuOpen ? null : item.label)
                    } else {
                      // If clicking on a regular menu item, select it
                      onMenuSelect(item.label)
                    }
                  }}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-pointer w-full ${
                    isMenuActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:bg-white hover:text-slate-600'
                  } ${isOpen ? 'justify-between' : 'justify-center'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-slate-600">
                      <IconComponent />
                    </div>
                    {isOpen && (
                      <span className="text-sm font-medium whitespace-nowrap font-aeonik">{item.label}</span>
                    )}
                  </div>
                  
                  {/* Submenu Chevron */}
                  {hasSubmenu && isOpen && (
                    isSubmenuOpen ? (
                      <MdOutlineKeyboardArrowDown className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    ) : (
                      <MdOutlineKeyboardArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    )
                  )}
                </button>

                {/* Submenu Items */}
                {hasSubmenu && isSubmenuOpen && isOpen && (
                  <div className="mt-2 ml-6 space-y-2 border-l-2 border-slate-200 pl-3">
                    {item.submenu.map((subitem, subIdx) => (
                      <button
                        key={subIdx}
                        onClick={() => {
                          onMenuSelect(subitem.label)
                        }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-pointer w-full text-left text-sm font-aeonik whitespace-nowrap ${
                          activeMenu === subitem.label
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-400 hover:bg-white hover:text-slate-600'
                        }`}
                      >
                        <span>{subitem.icon}</span>
                        <span>{subitem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="border-t-[0.50px] border-slate-200 py-4 px-2.5">
        <div className="flex flex-col gap-3">
          {/* Tooltip/Info Box */}
          {isOpen && (
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-white text-xs font-medium font-aeonik">💡 Boosted listings are promoted properties paid for by hosts.</p>
            </div>
          )}
          
          {/* Profile Button */}
          <button className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-white transition-all duration-200 text-slate-400 hover:text-slate-600 w-full cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-slate-600">
              <ProfileIcon />
            </div>
            {isOpen && <span className="text-sm font-medium font-aeonik">Profile</span>}
          </button>
          
          {/* Logout Button */}
          <button className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 text-slate-400 hover:text-red-600 w-full cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-slate-600">
              <LogoutIcon />
            </div>
            {isOpen && <span className="text-sm font-medium font-aeonik">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar