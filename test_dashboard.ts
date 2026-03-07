
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function testDashboard() {
  // Login as bodega
  const loginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bodega', password: 'bodega123' }),
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }

  const { token } = await loginRes.json();
  console.log('Logged in, token:', token);

  // Get Dashboard
  const dashRes = await fetch(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!dashRes.ok) {
    console.error('Dashboard failed:', await dashRes.text());
    return;
  }

  const data = await dashRes.json();
  console.log('Dashboard Data:', JSON.stringify(data, null, 2));
}

testDashboard();
