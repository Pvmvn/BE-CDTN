const https = require('https');

const data = JSON.stringify({
  name: "Test Name",
  email: `test${Date.now()}@gmail.com`,
  password: "password123"
});

const options = {
  hostname: 'be-cdtn.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseBody = '';
  res.on('data', d => {
    responseBody += d;
  });
  res.on('end', () => {
    console.log('Response: ', responseBody);
  });
});

req.on('error', error => {
  console.error('Error: ', error);
});

req.write(data);
req.end();
