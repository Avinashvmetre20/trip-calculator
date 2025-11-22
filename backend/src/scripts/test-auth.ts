import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
  try {
    // 1. Register
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    console.log(`Registering user: ${email}`);
    const registerRes = await axios.post(`${API_URL}/register`, {
      email,
      password,
      name,
    });
    console.log('Register success:', registerRes.data);

    const token = registerRes.data.token;

    // 2. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    console.log('Login success:', loginRes.data);

    // 3. Get Me
    console.log('Getting user profile...');
    const meRes = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Get Me success:', meRes.data);

  } catch (error: any) {
    console.error('Auth Test Failed:', error.response ? error.response.data : error.message);
  }
}

testAuth();
