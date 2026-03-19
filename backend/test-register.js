const fs = require('fs');
const jwt = require('jsonwebtoken');

async function testRegister() {
  const token = jwt.sign({ email: 'bob@gmail.com', emailVerified: true }, 'rentmate_super_secret_key_2024', { expiresIn: '15m' });
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  const appendField = (name, val) => {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`;
  };
  appendField('name', 'Bob');
  appendField('email', 'bob@gmail.com');
  appendField('password', 'password123');
  appendField('role', 'student');
  appendField('branch', 'CSE');
  appendField('phone', '+919876543222');
  appendField('emailToken', token);

  const fileData = 'mock image bytes';
  
  body += `--${boundary}\r\nContent-Disposition: form-data; name="collegeIdImage"; filename="college1.jpg"\r\nContent-Type: image/jpeg\r\n\r\n${fileData}\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="selfieImage"; filename="selfie1.jpg"\r\nContent-Type: image/jpeg\r\n\r\n${fileData}\r\n`;
  body += `--${boundary}--\r\n`;

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    const data = await res.json();
    console.log("RESPONSE:", data);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
testRegister();
