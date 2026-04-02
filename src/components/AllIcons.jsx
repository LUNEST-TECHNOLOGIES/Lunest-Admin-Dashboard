/**
 * UNIFIED ICONS FILE
 * All icons for Dashboard, Sidebar, Navbar in one simple, well-organized file
 * 
 * Usage:
 * import { DashboardIcons, SidebarIcons, NavbarIcons, AlertIcons, TableIcons } from '@/components/AllIcons'
 */

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS ICONS (Linked to assets folder)
// ═══════════════════════════════════════════════════════════════════════════

export const BookingsIcon = () => (
  <img src="/assets/Icon-1.svg" alt="Bookings" className="w-full h-full" />
);

export const RevenueIcon = () => (
  <img src="/assets/Icon-2.svg" alt="Revenue" className="w-full h-full" />
);

export const UsersIcon = () => (
  <img src="/assets/Icon.svg" alt="Users" className="w-full h-full" />
);

export const KycIcon = () => (
  <img src="/assets/Component 51.svg" alt="KYC" className="w-full h-full" />
);

export const DisputesIcon = () => (
  <img src="/assets/Add_ring_light.svg" alt="Disputes" className="w-full h-full" />
);

// New icons for Total Users and Active Guests
export const TotalUsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GuestsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ListingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR MENU ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const DashboardIcon = () => (
  <img src="/assets/icons/sidebar/Component 1-1.svg" alt="Dashboard" className="w-full h-full" />
);

export const ManagementIcon = () => (
  <img src="/assets/icons/sidebar/Component 1.svg" alt="Management" className="w-full h-full" />
);

export const FinanceIcon = () => (
  <img src="/assets/icons/sidebar/dollar-circle.svg" alt="Finance" className="w-full h-full" />
);

export const PromotionsIcon = () => (
  <img src="/assets/icons/sidebar/megaphone-02.svg" alt="Promotions" className="w-full h-full" />
);

export const SupportIcon = () => (
  <img src="/assets/icons/sidebar/headset.svg" alt="Support" className="w-full h-full" />
);

export const SubscriptionIcon = () => (
  <img src="/assets/icons/sidebar/note-05.svg" alt="Subscription" className="w-full h-full" />
);

export const SettingsIcon = () => (
  <img src="/assets/icons/sidebar/shield-tick.svg" alt="Settings" className="w-full h-full" />
);

export const ModerationIcon = () => (
  <img src="/assets/icons/sidebar/folder-open.svg" alt="Moderation" className="w-full h-full" />
);

export const MessagesIcon = () => (
  <img src="/assets/icons/sidebar/message.svg" alt="Messages" className="w-full h-full" />
);

export const AuditIcon = () => (
  <img src="/assets/icons/sidebar/archive.svg" alt="Audit" className="w-full h-full" />
);

// ═══════════════════════════════════════════════════════════════════════════
// NAVBAR / FOOTER ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const ProfileIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const LogoutIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 16l4-4m0 0l-4-4m4 4H9m0-10h3V4H5v16h7v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// ALERT ICONS
// ═══════════════════════════════════════════════════════════════════════════

export const WarningIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ErrorIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SuccessIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const InfoIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// TABLE ICONS (Edit, Delete, View, Sort)
// ═══════════════════════════════════════════════════════════════════════════

export const EditIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15H9v-3L18.5 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DeleteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6l-.867 13.026A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.974L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2m3 0a1 1 0 00-1-1h-2a1 1 0 00-1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ViewIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const SortUpIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SortDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL UI ICONS (Menu, Close, Search, etc)
// ═══════════════════════════════════════════════════════════════════════════

// Toggle/Menu Icons - using assets
export const MenuIcon = () => (
  <img src="/assets/icons/sidebar/menu-icon.svg" alt="Menu" className="w-6 h-6" />
);

export const CloseIcon = () => (
  <img src="/assets/icons/sidebar/close-icon.svg" alt="Close" className="w-6 h-6" />
);

// Alternative: Chevron icons for toggle
export const ChevronLeftIcon = () => (
  <img src="/assets/icons/sidebar/sidebar-left.svg" alt="Chevron Left" className="w-6 h-6 " />
);

export const ChevronRightIcon = () => (
  <img src="/assets/icons/sidebar/sidebar-right.svg" alt="Chevron Right" className="w-6 h-6" />
);

// Logo Icons
export const LogoOpenIcon = () => (
  <img src="/assets/icons/sidebar-icon.svg" alt="Logo Open" className="w-full h-full" />
);

export const LogoCollapsedIcon = () => (
  <img src="/assets/icons/LUNEST ICON 1.svg" alt="Logo Collapsed" className="w-full h-full" />
);

export const SearchIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChevronDownIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronUpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTIONS - Pre-organized icon groups
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DASHBOARD STATS ICONS
 * Used in StatsCard components
 */
export const DashboardIcons = {
  bookings: BookingsIcon,
  revenue: RevenueIcon,
  users: UsersIcon,
  kyc: KycIcon,
  disputes: DisputesIcon,
};

/**
 * SIDEBAR MENU ICONS
 * Used in navigation menu
 */
export const SidebarIcons = {
  dashboard: DashboardIcon,
  management: ManagementIcon,
  finance: FinanceIcon,
  promotions: PromotionsIcon,
  support: SupportIcon,
  subscription: SubscriptionIcon,
  settings: SettingsIcon,
  moderation: ModerationIcon,
  messages: MessagesIcon,
  audit: AuditIcon,
};

/**
 * NAVBAR / PROFILE ICONS
 * Used in profile dropdown and navbar
 */
export const NavbarIcons = {
  profile: ProfileIcon,
  logout: LogoutIcon,
};

/**
 * ALERT ICONS
 * Used in alert cards and notifications
 */
export const AlertIcons = {
  warning: WarningIcon,
  error: ErrorIcon,
  success: SuccessIcon,
  info: InfoIcon,
};

/**
 * TABLE ACTION ICONS
 * Used in data table rows for edit, delete, view, sort
 */
export const TableIcons = {
  edit: EditIcon,
  delete: DeleteIcon,
  view: ViewIcon,
  sortUp: SortUpIcon,
  sortDown: SortDownIcon,
};

/**
 * GENERAL UI ICONS
 * Used across the app for common UI elements
 */
export const GeneralIcons = {
  menu: MenuIcon,
  close: CloseIcon,
  search: SearchIcon,
  clock: ClockIcon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  plus: PlusIcon,
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT EVERYTHING
// ═══════════════════════════════════════════════════════════════════════════

export const AllIcons = {
  DashboardIcons,
  SidebarIcons,
  NavbarIcons,
  AlertIcons,
  TableIcons,
  GeneralIcons,
};

export default AllIcons;
