import React from 'react';
import ErrorBoundary from './management/shared/ErrorBoundary';
import ListingManagement from './management/listings/ListingManagement';
import BookingManagement from './management/bookings/BookingManagement';
import UsersManagement from './management/users/UsersManagement';
import KYCVerification from './management/kyc/KYCVerification';
import AdminManagement from './management/admin/AdminManagement';
import ReferralManagement from './management/finance/ReferralManagement';
import CouponManagement from './management/finance/CouponManagement';

const ManagementMenu = ({ activeSubmenu = 'Listing Management' }) => {
  return (
    <div>
      {/* Content based on active submenu from sidebar */}
      {activeSubmenu === 'Listing Management' && (
        <ErrorBoundary>
          <ListingManagement />
        </ErrorBoundary>
      )}

      {activeSubmenu === 'Booking Management' && (
        <BookingManagement />
      )}

      {activeSubmenu === 'Users' && (
        <UsersManagement />
      )}

      {activeSubmenu === 'KYC Verification' && (
        <KYCVerification />
      )}

      {activeSubmenu === 'Admin Management' && (
        <AdminManagement />
      )}

      {activeSubmenu === 'Referrals and Reward' && (
        <ReferralManagement />
      )}

      {activeSubmenu === 'Coupon Management' && (
        <CouponManagement />
      )}
    </div>
  );
};

export default ManagementMenu;
