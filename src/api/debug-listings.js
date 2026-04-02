// Debug utility for troubleshooting admin listings
// Usage: Add this to browser console to test endpoints

window.debugListings = async() => {
    console.log('=== LISTINGS DEBUG ===\n');

    // 1. Check auth token
    const token = localStorage.getItem('authToken');
    console.log('1. Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

    if (!token) {
        console.warn('âš ï¸  No auth token found. User may not be logged in.');
        return;
    }

    // 2. Test backend health
    console.log('\n2. Testing backend health...');
    try {
        const healthResponse = await fetch('http://localhost:3000/health');
        const health = await healthResponse.json();
        console.log('âœ… Backend health:', health);
    } catch (e) {
        console.error('âŒ Backend unreachable:', e.message);
        return;
    }

    // 3. Test listings endpoint
    console.log('\n3. Testing /admin/listings endpoint...');
    try {
        const response = await fetch('http://localhost:3000/v1/admin/listings', {
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
            console.log('âœ… Endpoint working!');
            console.log('Response:', data);
            console.log(`Listings returned: ${data.body?.length || 0} items`);
        } else {
            console.error('âŒ Endpoint error:');
            console.error('Status:', response.status);
            console.error('Message:', data?.message || data);
        }
    } catch (e) {
        console.error('âŒ Request failed:', e.message);
    }

    // 4. Test public listings endpoint (for comparison)
    console.log('\n4. Testing /listings/listing endpoint (public)...');
    try {
        const response = await fetch('http://localhost:3000/v1/listings/listing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '{}'
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const data = await response.json();

        if (response.ok) {
            console.log('âœ… Public endpoint working!');
            console.log(`Listings returned: ${data.body?.length || 0} items`);
        } else {
            console.error('âŒ Endpoint error:', data?.message || data);
        }
    } catch (e) {
        console.error('âŒ Request failed:', e.message);
    }

    console.log('\n=== END DEBUG ===');
};

// Call like this in console: window.debugListings()
