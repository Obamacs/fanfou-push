const { Resend } = require('resend');
require('dotenv').config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
  console.log("Sending test email...");
  const response = await resend.emails.send({
    from: process.env.EMAIL_FROM || "饭否 <noreply@mail.meal-meet.com>",
    to: "ldlh@sina.com",
    subject: "Test Debug Email from Cron",
    html: "<p>This is a test email to debug the cron job.</p>"
  });
  console.log("Response:", response);
}

testSend().catch(console.error);
