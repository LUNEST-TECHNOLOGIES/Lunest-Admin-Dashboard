# Tab Filter Category Mapping

This document defines the exact mapping between frontend tabs and backend transaction categories to ensure proper synchronization.

## Backend Transaction Categories (from transaction_model.ts)

```typescript
category: 'BOOKING' | 'TOP_UP' | 'REWARD' | 'WITHDRAWAL' | 'REFUND' | 'HOST_EARNING' | 'PLATFORM_FEE' | 'TRANSFER' | 'SECURITY_FEE' | 'RENT' | 'SERVICE_CHARGE' | 'SECURITY_DEPOSIT' | 'VAT' | 'CANCELLATION_PENALTY' | 'CANCELLATION_REFUND' | 'COUPON_PAYMENT' | 'ADJUSTMENT' | 'CASH_REWARD' | 'ADDED_FUNDS'
```

## Frontend Tab to Category Mapping

| Tab Name | Categories | Type Filter | Description |
|-----------|------------|-------------|-------------|
| **All Transactions** | (none) | (none) | Shows all transactions |
| **Guest Payments** | `BOOKING` | `DEBIT` | Money paid by guests for bookings |
| **Host Earnings** | `HOST_EARNING,RENT,SERVICE_CHARGE` | `CREDIT` | Money earned by hosts |
| **Withdrawals** | `WITHDRAWAL` | (none) | User withdrawals from system |
| **App Fees** | `PLATFORM_FEE` | (none) | Platform service fees |
| **VAT** | `VAT` | (none) | 7.5% government tax |
| **Caution Fees** | `SECURITY_DEPOSIT` | (none) | Security deposits on hold |
| **Coupons** | `COUPON_PAYMENT` | (none) | Coupon discount transactions |
| **Wallet Actions** | `TOP_UP,ADJUSTMENT,TRANSFER,ADDED_FUNDS` | (none) | Wallet management operations |
| **Refunds** | `REFUND,CANCELLATION_REFUND,CANCELLATION_PENALTY` | (none) | Refund transactions |
| **Rewards** | `REWARD,CASH_REWARD` | (none) | Reward and loyalty transactions |

## Implementation Details

### Filter Function Logic
```javascript
const getTabFilters = (tab) => {
  const filters = {};
  
  switch (tab) {
    case 'Guest Payments':
      filters.category = 'BOOKING';
      filters.type = 'DEBIT';
      break;
    case 'Host Earnings':
      filters.category = 'HOST_EARNING,RENT,SERVICE_CHARGE';
      filters.type = 'CREDIT';
      break;
    // ... other cases
  }
  
  return filters;
};
```

### Backend Query Processing
- Single categories: `category = 'CATEGORY_NAME'`
- Multiple categories: `category IN ['CAT1', 'CAT2', 'CAT3']`
- Type filtering: `type = 'CREDIT' | 'DEBIT'`
- Internal transactions always excluded: `metadata.internal != true`

## Validation Rules

### Client-Side Validation
1. **Category Matching**: All returned transactions must match expected categories
2. **Type Validation**: For tabs with type filters, verify transaction type
3. **Auto-Correction**: Invalid transactions are filtered out automatically
4. **Logging**: All validation failures are logged for debugging

### Backend Validation
1. **Category Existence**: Only valid backend categories are accepted
2. **Internal Filtering**: Internal summary transactions are excluded
3. **Date Range**: Proper date filtering applied
4. **Status Filtering**: Status filters applied correctly

## Debug Logging

### Frontend Logging
```javascript
console.log('[FinancialManagement] Tab Filter Applied:', {
  activeTab,
  filters: tabFilters,
  finalFilters: filters
});
```

### Backend Logging
```javascript
console.log('[AdminTransactionController] WITHDRAWAL Filter Applied:', query);
console.log('[AdminTransactionController] Available Categories:', categories);
```

## Common Issues & Solutions

### Issue: Wrong transactions appearing in tab
**Solution**: Check both frontend and backend category mapping, ensure no internal transactions are included

### Issue: Empty tab when data should exist
**Solution**: Verify category names match exactly, check transaction status filters

### Issue: Duplicate transactions across tabs
**Solution**: Ensure category filters are mutually exclusive where appropriate

### Issue: Performance issues
**Solution**: Add proper database indexes on category and type fields

## Maintenance Notes

1. **Always update both components** when changing tab filters
2. **Test with real data** to ensure categories match actual transactions
3. **Monitor console logs** for validation warnings
4. **Keep this document updated** when adding new tabs or categories

## Testing Checklist

- [ ] Each tab shows only expected transaction categories
- [ ] No internal transactions appear in any tab
- [ ] Type filtering works correctly (CREDIT/DEBIT)
- [ ] Date range filtering works
- [ ] Status filtering works
- [ ] Search functionality works
- [ ] Export functionality respects tab filters
- [ ] Validation logs appear when issues detected
