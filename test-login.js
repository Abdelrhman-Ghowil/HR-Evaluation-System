// Test script to check login API directly
import axios from 'axios';

const API_BASE_URL = 'https://hr-eval-sys-git-feature-schema-v2-bd5633-mohs-projects-85795635.vercel.app/';

const testLogin = async () => {
  try {
    console.log('Testing login with provided credentials...');
    console.log('API URL:', API_BASE_URL);
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
      email: 'conan@gmail.com',
      username: 'conan',
      password: '#$123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
    // Test getting user info with the token
    console.log('\nTesting user info retrieval...');
    
    // Try different possible endpoints for user info
    const possibleEndpoints = [
      '/api/accounts/users/me/',
      '/api/auth/me/',
      '/api/user/',
      '/api/accounts/profile/'
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const userResponse = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${response.data.access}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        console.log(`✅ User info retrieved from ${endpoint}!`);
        console.log('User data:', userResponse.data);
        break;
      } catch (err) {
        console.log(`❌ ${endpoint} failed:`, err.response?.status || err.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Login failed!');
    
    if (error.response) {
      // Server responded with error status
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Error Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received:');
      console.log('Request:', error.request);
    } else {
      // Something else happened
      console.log('Error:', error.message);
    }
    
    console.log('Full error object:', error);
  }
};

// Also test if the API is reachable
const testConnection = async () => {
  try {
    console.log('\nTesting API connection...');
    const response = await axios.get(`${API_BASE_URL}/`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });
    console.log('✅ API is reachable');
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ API connection failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  await testConnection();
  await testLogin();
};

runTests();