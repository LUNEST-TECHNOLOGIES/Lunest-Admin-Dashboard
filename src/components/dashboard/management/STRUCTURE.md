# Management Components Structure

This directory contains all admin management features organized by domain.

## Folder Organization

### `/listings`
Handles all listing management features including:
- Listing display and management table
- Listing approval/rejection workflows
- Listing status filters and search

**Files:**
- `ListingManagement.jsx` - Main listing management container
- `ListingTable.jsx` - Data table component
- `ListingTableRow.jsx` - Individual row renderer
- `ListingTooltip.jsx` - Help tooltip component
- `ListingFilters.jsx` - Filter UI component
- `ListingFiltersDropdown.jsx` - Advanced filters dropdown

### `/bookings`
Handles all booking management features:
- Booking display and search
- Booking status tabs
- Booking action workflows

**Files:**
- `BookingManagement.jsx` - Main booking management container
- `BookingActionButton.jsx` - Action menu for individual bookings

### `/users`
Handles user management features:
- User list display and filtering
- User role-based tabs
- User action workflows (ban, flag)

**Files:**
- `UsersManagement.jsx` - Main users management container

### `/kyc`
Handles KYC verification features:
- KYC submission review
- KYC status filtering
- KYC document display

**Files:**
- `KYCVerification.jsx` - Main KYC verification container

### `/modals`
Reusable modal components for all workflows:
- Approval/rejection workflows
- Action confirmations
- User actions (ban, flag, etc.)

**Files:**
- `ApproveListing.jsx` - Approve listing modal
- `RejectListing.jsx` - Reject listing modal
- `SuspendListing.jsx` - Suspend listing modal
- `EditListing.jsx` - Edit listing modal
- `RefundReviewModal.jsx` - Refund review modal
- `AddNoteModal.jsx` - Add note to booking modal
- `ApplyPenaltyModal.jsx` - Apply penalty to host modal
- `MassApprovalModal.jsx` - Mass approval workflow modal
- `ListingDetailsPopup.jsx` - Listing details popup
- `BanUserModal.jsx` - Ban user modal
- `FlagUserModal.jsx` - Flag user modal

### `/shared`
Shared components used across management sections:
- Common UI components
- Shared utilities
- Common patterns

**Files:**
- `ActionMenu.jsx` - Reusable action menu component
- `AlertNotification.jsx` - Alert/notification component

## Import Patterns

### Before (Flat structure)
```javascript
import ListingManagement from '../dashboard/management/ListingManagement';
import ListingTable from '../dashboard/management/ListingTable';
import ApproveListing from '../dashboard/management/ApproveListing';
```

### After (Organized structure)
```javascript
import ListingManagement from '../dashboard/management/listings/ListingManagement';
import ListingTable from '../dashboard/management/listings/ListingTable';
import ApproveListing from '../dashboard/management/modals/ApproveListing';
```

## Adding New Features

When adding new features:
1. Identify the domain (listings, bookings, users, kyc)
2. Add components to the appropriate folder
3. Update the folder's index file if needed
4. Create corresponding modals in `/modals`
5. Update ManagementMenu.jsx routes

## Notification Integration

All modals integrate with the `NotificationProvider` for user feedback:
- Success notifications on action completion
- Error notifications on failure
- Warning notifications for validation
- Info notifications for general information

See `src/components/ui/NotificationProvider.jsx` for usage details.
