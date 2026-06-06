const https = require('https');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function main() {
  console.log("=== 1. Domain & HTTPS ===");
  const homeRes = await checkUrl('https://meal-meet.com');
  console.log("Home status:", homeRes.status);
  
  console.log("\n=== 2. Database Connection ===");
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    console.log("DB Connection: OK, User Count:", userCount);
  } catch (e) {
    console.log("DB Connection: FAILED", e.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log("\n=== 3. Environment Variables ===");
  const envContent = fs.readFileSync('.env', 'utf8');
  const envKeys = envContent.split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => line.split('=')[0]);
  
  const requiredKeys = [
    'DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 
    'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'ANTHROPIC_API_KEY', 'NEXT_PUBLIC_AMAP_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredKeys.forEach(key => {
    console.log(`${key}: ${envKeys.includes(key) ? 'Present ✅' : 'Missing ❌'}`);
  });
}

main();
