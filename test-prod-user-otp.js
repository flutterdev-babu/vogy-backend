const https = require('https');

const data = JSON.stringify({
  phone: '+916302567165',
  role: 'USER'
});

const options = {
  hostname: 'vogy-backend.onrender.com',
  port: 443,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
