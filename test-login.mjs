import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔍 测试 NextAuth 登录 API...\n');
    
    // Test 1: 测试错误的密码
    console.log('Test 1: 错误密码');
    let res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    console.log(`状态: ${res.status}`);
    console.log(`响应:`, await res.text());
    console.log('');

    // Test 2: 测试正确的密码
    console.log('Test 2: 正确密码');
    res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });
    console.log(`状态: ${res.status}`);
    console.log(`响应:`, await res.text());
  } catch (e) {
    console.error('错误:', e.message);
  }
}

testLogin();
