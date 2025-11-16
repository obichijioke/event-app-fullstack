const http = require('http');

const data = JSON.stringify({
  email: 'organizer@eventflow.dev',
  password: 'Password123!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const json = JSON.parse(responseData);
    console.log(json.accessToken);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
