/**
 * Test script to verify admin API endpoints are working
 * Run this in the browser console to debug
 */

// Test the transactions endpoint
async function testAdminAPI() {
  console.log('🧪 Testing Admin Transaction API Endpoints...\n');

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/v1' 
    : 'https://api.lunest.app/v1';

  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // Test 1: Get transactions summary
    console.log('1️⃣  Testing GET /admin/transactions/summary...');
    const summaryRes = await fetch(`${API_BASE}/admin/transactions/summary`, { headers });
    const summaryData = await summaryRes.json();
    console.log('Response:', summaryData);
    console.log('Status:', summaryRes.status, summaryData.success ? '✅' : '❌');
    console.log('---\n');

    // Test 2: Get all transactions
    console.log('2️⃣  Testing GET /admin/transactions (all)...');
    const allRes = await fetch(`${API_BASE}/admin/transactions`, { headers });
    const allData = await allRes.json();
    console.log('Response structure:', Object.keys(allData));
    console.log('Body structure:', allData.body ? Object.keys(allData.body) : 'no body');
    console.log('Transactions count:', allData.body?.transactions?.length || 0);
    console.log('Status:', allRes.status, allData.success ? '✅' : '❌');
    console.log('Full response:', allData);
    console.log('---\n');

    // Test 3: Get coupon transactions
    console.log('3️⃣  Testing GET /admin/transactions?category=COUPON_PAYMENT...');
    const couponRes = await fetch(`${API_BASE}/admin/transactions?category=COUPON_PAYMENT`, { headers });
    const couponData = await couponRes.json();
    console.log('Response:', couponData);
    console.log('Coupon transactions count:', couponData.body?.transactions?.length || 0);
 console.log('Status:', couponRes.status, couponData.success ? '✅' : '❌');
    if (couponData.body?.transactions?.length > 0) {
      console.log('Sample coupon transaction:', couponData.body.transactions[0]);
    }
    console.log('---\n');

    // Test 4: Get security deposit transactions
    console.log('4️⃣  Testing GET /admin/transactions?category=SECURITY_DEPOSIT...');
    const depositRes = await fetch(`${API_BASE}/admin/transactions?category=SECURITY_DEPOSIT`, { headers });
    const depositData = await depositRes.json();
    console.log('Security deposit transactions count:', depositData.body?.transactions?.length || 0);
    console.log('Status:', depositRes.status, depositData.success ? '✅' : '❌');
    console.log('---\n');

    console.log('✨ API Test Complete!');
    console.log('If counts are 0, check if transactions exist in database via backend logs');

  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
}

// Run the test
testAdminAPI();
