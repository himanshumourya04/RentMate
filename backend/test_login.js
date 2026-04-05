const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rentmate.dev',
      password: 'Admin@1234'
    });
    console.log("LOGIN SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("LOGIN FAILED:", err.response.status, err.response.data);
    } else {
      console.error("LOGIN ERROR:", err.message);
    }
  }

  try {
    const res2 = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'admin@rentmate.dev',
      password: 'Admin@1234'
    });
    console.log("ADMIN LOGIN SUCCESS:", res2.data);
  } catch (err) {
    if (err.response) {
      console.error("ADMIN LOGIN FAILED:", err.response.status, err.response.data);
    } else {
      console.error("ADMIN LOGIN ERROR:", err.message);
    }
  }
}

testLogin();
