const https = require('https');

const data = JSON.stringify({
  app_id: "cli_a9315b0647785ccb",
  app_secret: "8SmlcRPUjpeilggQy0NFVfGlgLswXq1n"
});

const req = https.request('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.write(data);
req.end();
