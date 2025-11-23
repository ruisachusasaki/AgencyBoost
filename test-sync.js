// Test script to verify Google Calendar sync is working
const fetch = require('node-fetch');

async function testSync() {
  try {
    // First, we need to authenticate as admin user
    console.log('1. Authenticating as admin user...');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joe@themediaoptimizers.com',
        password: 'securepassword123'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✓ Login successful');

    // Check calendar connection status
    console.log('\n2. Checking calendar connection status...');
    const statusResponse = await fetch('http://localhost:5000/api/google-calendar/status', {
      headers: {
        'Cookie': cookies
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const status = await statusResponse.json();
    console.log('Calendar connections:', status.connections);

    if (status.connections && status.connections.length > 0) {
      console.log('\n3. Attempting to sync calendar...');
      
      const syncResponse = await fetch('http://localhost:5000/api/google-calendar/sync', {
        method: 'POST',
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });

      const syncResult = await syncResponse.json();
      
      if (syncResponse.ok) {
        console.log('✓ Sync successful!');
        console.log('Result:', syncResult);
      } else {
        console.log('✗ Sync failed:');
        console.log('Status:', syncResponse.status);
        console.log('Error:', syncResult);
      }
    } else {
      console.log('No calendar connections found. Please connect a Google Calendar first.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSync();