const API_BASE = 'https://nofx-gyc567.replit.app/api';

async function testLogin() {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'gyc567@gmail.com',
        password: 'eric8577HH'
      }),
    });

    const data = await response.json();
    
    console.log('HTTP Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful');
      console.log('Token:', data.token);
      console.log('User ID:', data.user_id);
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
