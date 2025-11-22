import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';
let tripId = 0;

const register = async () => {
  try {
    await axios.post(`${API_URL}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    });
    console.log('Registration successful');
  } catch (error: any) {
    console.log('Registration skipped or failed (user might exist)');
  }
};

const login = async () => {
  try {
    // We need to know the email used for registration or a fixed one if we want to reuse
    // For this test, let's use a fixed email but try to register it first
    const email = 'test_trip_user@example.com';
    
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password: 'password123',
        name: 'Trip Tester'
      });
    } catch (e) {
      // Ignore if user exists
    }

    const res = await axios.post(`${API_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    token = res.data.token;
    console.log('Login successful, token received');
  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

const createTrip = async () => {
  try {
    const res = await axios.post(
      `${API_URL}/trips`,
      {
        name: 'Test Trip',
        description: 'A test trip description',
        currency: 'USD'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    tripId = res.data.data.id;
    console.log('Trip created:', res.data.data);
  } catch (error: any) {
    console.error('Create trip failed:', error.response?.data || error.message);
  }
};

const getTrips = async () => {
  try {
    const res = await axios.get(`${API_URL}/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Trips fetched:', res.data.data.length);
  } catch (error: any) {
    console.error('Get trips failed:', error.response?.data || error.message);
  }
};

const getTripDetails = async () => {
  try {
    const res = await axios.get(`${API_URL}/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Trip details fetched:', res.data.data.name);
  } catch (error: any) {
    console.error('Get trip details failed:', error.response?.data || error.message);
  }
};

const testInvitation = async () => {
  console.log('--- Testing Invitation ---');
  try {
    // 1. Generate Link (User A is logged in)
    const res = await axios.get(`${API_URL}/trips/${tripId}/invite`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const link = res.data.data.link;
    console.log('Invite link generated:', link);
    
    const inviteToken = link.split('token=')[1];

    // 2. Register/Login User B
    const emailB = `invitee${Date.now()}@example.com`;
    await axios.post(`${API_URL}/auth/register`, {
      email: emailB,
      password: 'password123',
      name: 'Invitee User'
    });
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: emailB,
      password: 'password123'
    });
    const tokenB = loginRes.data.token;
    console.log('Invitee logged in');

    // 3. Join Trip
    const joinRes = await axios.post(`${API_URL}/trips/join`, 
      { token: inviteToken },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log('Joined trip:', joinRes.data);

    // 4. Verify Membership
    const membersRes = await axios.get(`${API_URL}/trips/${tripId}/members`, {
         headers: { Authorization: `Bearer ${token}` } // Check as admin
    });
    console.log('Trip members count:', membersRes.data.data.length);
    
  } catch (error: any) {
    console.error('Invitation test failed:', error.response?.data || error.message);
  }
};

const runTests = async () => {
  await register();
  await login();
  await createTrip();
  await getTrips();
  await getTripDetails();
  await testInvitation();
};

runTests();
