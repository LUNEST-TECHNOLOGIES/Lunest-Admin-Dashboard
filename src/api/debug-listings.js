// Debug utility for troubleshooting admin listings
// Usage: Add this to browser console to test endpoints

window.debugListings = async() => {
    console.log('=== LISTINGS DEBUG ===\n');

    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/v1' 
        : 'https://api.lunest.app/v1';

    // 1. Check auth token
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('1. Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

    if (!token) {
        console.warn('⚠️ No auth token found. User may not be logged in.');
        return;
    }

    // 2. Test backend health
    console.log('\n2. Testing backend health...');
    try {
        const healthUrl = API_BASE.replace('/v1', '/health');
        const healthResponse = await fetch(healthUrl);
        const health = await healthResponse.json();
        console.log('✅ Backend health:', health);
    } catch (e) {
        console.error('❌ Backend unreachable:', e.message);
    }

    // 3. Test listings endpoint
    console.log(`\n3. Testing ${API_BASE}/admin/listings endpoint...`);
    try {
        const response = await fetch(`${API_BASE}/admin/listings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: '{}'
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Endpoint working!');
            console.log('Response:', data);
            console.log(`Listings returned: ${data.body?.length || 0} items`);
        } else {
            console.error('❌ Endpoint error:');
            console.error('Status:', response.status);
            console.error('Message:', data?.message || data);
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
    }

    // 4. Test public listings endpoint (for comparison)
    console.log(`\n4. Testing ${API_BASE}/listings/listing endpoint (public)...`);
    try {
        const response = await fetch(`${API_BASE}/listings/listing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '{}'
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Public endpoint working!');
            console.log(`Listings returned: ${data.body?.length || 0} items`);
        } else {
            console.error('❌ Endpoint error:', data?.message || data);
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
    }

    console.log('\n=== END DEBUG ===');
};

// Call like this in console: window.debugListings()
