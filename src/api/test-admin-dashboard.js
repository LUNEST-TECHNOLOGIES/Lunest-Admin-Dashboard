#!/usr/bin/env node

/**
 * LUNEST ADMIN DASHBOARD FIX - QUICK TEST SCRIPT
 * 
 * Run this in browser console on admin dashboard page:
 * 1. Navigate to Financial Management page
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy entire file content and paste into console
 * 5. Run: testAdminDashboard()
 */

async function testAdminDashboard() {
  console.log('🧪 LUNEST ADMIN DASHBOARD - TRANSACTION SYSTEM TEST\n');
  console.log('📊 Testing API endpoints...\n');

  const BASE_URL = 'http://localhost:8080/v1';
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('❌ No authentication token found. Please login first.');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let passCount = 0;
  let failCount = 0;

  // Test 1: Summary endpoint
  try {
    console.log('📈 Test 1: GET /admin/transactions/summary');
    const res = await fetch(`${BASE_URL}/admin/transactions/summary`, { headers });
    const data = await res.json();
    
    if (res.ok && data.success && data.body) {
      console.log('  ✅ Response format correct');
      console.log('  📌 Overview keys:', Object.keys(data.body.overview || data.body));
      passCount++;
    } else {
      console.log('  ❌ Response error:', data);
      failCount++;
    }
  } catch (err) {
    console.error('  ❌ Network error:', err.message);
    failCount++;
  }
  console.log('');

  // Test 2: All transactions
  try {
    console.log('📋 Test 2: GET /admin/transactions');
    const res = await fetch(`${BASE_URL}/admin/transactions`, { headers });
    const data = await res.json();
    
    if (res.ok && data.success && data.body) {
      const txnCount = data.body.transactions?.length || 0;
      console.log(`  ✅ Found ${txnCount} transactions`);
      if (txnCount > 0) {
        console.log(`  📌 Sample transaction categories: ${[...new Set(data.body.transactions.map(t => t.category))].join(', ')}`);
      }
      passCount++;
    } else {
      console.log('  ❌ Response error:', data);
      failCount++;
    }
  } catch (err) {
    console.error('  ❌ Network error:', err.message);
    failCount++;
  }
  console.log('');

  // Test 3: Coupon transactions
  try {
    console.log('🎟️  Test 3: GET /admin/transactions?category=COUPON_PAYMENT');
    const res = await fetch(`${BASE_URL}/admin/transactions?category=COUPON_PAYMENT`, { headers });
    const data = await res.json();
    
    if (res.ok && data.success && data.body) {
      const txnCount = data.body.transactions?.length || 0;
      console.log(`  ✅ Found ${txnCount} coupon transactions`);
      
      if (txnCount > 0) {
        const sample = data.body.transactions[0];
        console.log('  📦 Sample Metadata Fields:');
        console.log(`    - couponCode: ${sample.metadata?.couponCode ? '✅' : '❌'}`);
        console.log(`    - discountAmount: ${sample.metadata?.discountAmount ? '✅' : '❌'}`);
        console.log(`    - originalAmount: ${sample.metadata?.originalAmount ? '✅' : '❌'}`);
        console.log(`    - finalAmount: ${sample.metadata?.finalAmount ? '✅' : '❌'}`);
        console.log(`    - bookingReference: ${sample.metadata?.bookingReference ? '✅' : '❌'}`);
        console.log(`    - guestName: ${sample.metadata?.guestName ? '✅' : '❌'}`);
        console.log('  📄 Full transaction:', sample);
      } else {
        console.log('  ⚠️  No coupon transactions found - ensure bookings with coupons were created');
      }
      passCount++;
    } else {
      console.log('  ❌ Response error:', data);
      failCount++;
    }
  } catch (err) {
    console.error('  ❌ Network error:', err.message);
    failCount++;
  }
  console.log('');

  // Test 4: Security deposit transactions
  try {
    console.log('🛡️  Test 4: GET /admin/transactions?category=SECURITY_DEPOSIT');
    const res = await fetch(`${BASE_URL}/admin/transactions?category=SECURITY_DEPOSIT`, { headers });
    const data = await res.json();
    
    if (res.ok && data.success && data.body) {
      const txnCount = data.body.transactions?.length || 0;
      console.log(`  ✅ Found ${txnCount} security deposit transactions`);
      passCount++;
    } else {
      console.log('  ❌ Response error:', data);
      failCount++;
    }
  } catch (err) {
    console.error('  ❌ Network error:', err.message);
    failCount++;
  }
  console.log('');

  // Test 5: Frontend state
  try {
    console.log('⚛️  Test 5: Frontend Application State');
    // Look for React DevTools or any visible state
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      const rows = tables[0].querySelectorAll('tbody tr');
      console.log(`  ✅ Found ${rows.length} transaction rows in table`);
      if (rows.length === 0) {
        console.log('  ⚠️  Table is empty - check if API returned data');
      }
      passCount++;
    } else {
      console.log('  ⚠️  No tables found - page may not be fully loaded');
    }
  } catch (err) {
    console.error('  ⚠️  Could not access DOM:', err.message);
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passCount} | ❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════\n');

  if (failCount === 0) {
    console.log('🎉 All tests passed! Admin dashboard should be working.');
  } else {
    console.log('⚠️  Some tests failed. Check the outputs above for details.');
    console.log('\nTroubleshooting:');
    console.log('1. Ensure backend server is running');
    console.log('2. Check browser console for CORS errors');
    console.log('3. Verify you are logged in as admin');
    console.log('4. Check backend logs for transaction creation errors');
  }
}

// Auto-run if in console
if (typeof window !== 'undefined') {
  console.log('Run: testAdminDashboard()');
}
