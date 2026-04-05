const axios = require('axios');

async function testLiveLogin() {
  const PROD_API = 'https://rentmate-1-0sbq.onrender.com/api';

  console.log(`\n=================================================`);
  console.log(`📡 WAKING UP RENDER BACKEND... THIS MAY TAKE 60s+`);
  console.log(`=================================================\n`);

  try {
    const health = await axios.get(`${PROD_API}/health`, { timeout: 120000 });
    console.log(`✅ Server is awake! Status:`, health.status, health.data);
  } catch (err) {
    console.error(`❌ Server Health Check Failed:`, err.message);
    if (err.response) console.error(`Response:`, err.response.status, err.response.data);
    return; // Stop if server is completely offline
  }

  console.log(`\n=================================================`);
  console.log(`🔐 TESTING ADMIN LOGIN ON LIVE SERVER...`);
  console.log(`=================================================\n`);

  try {
    const adminRes = await axios.post(`${PROD_API}/admin/login`, {
      email: 'admin8692@test.com',
      password: 'admin@2026_test'
    });
    console.log('✅ LIVE ADMIN LOGIN SUCCESS!');
    console.log('Data:', adminRes.data);
  } catch (err) {
    console.error('❌ LIVE ADMIN LOGIN FAILED:', err.response ? err.response.status : err.message);
    if (err.response) console.error('Data:', err.response.data);
  }

  console.log(`\n=================================================`);
  console.log(`🎓 TESTING STUDENT LOGIN ON LIVE SERVER...`);
  console.log(`=================================================\n`);

  try {
    const studentRes = await axios.post(`${PROD_API}/auth/login`, {
      email: 'himanshumourya313@gmail.com',
      password: 'Himanshu@123'
    });
    console.log('✅ LIVE STUDENT LOGIN SUCCESS!');
    console.log('Data:', studentRes.data);
  } catch (err) {
    console.error('❌ LIVE STUDENT LOGIN FAILED:', err.response ? err.response.status : err.message);
    if (err.response) console.error('Data:', err.response.data);
  }
}

testLiveLogin();
