const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkEmails() {
  try {
    const data = await resend.emails.list();
    console.log("Recent emails sent via Resend:");
    if (data.data && data.data.data) {
      data.data.data.slice(0, 10).forEach(email => {
        console.log(`[${email.created_at}] To: ${email.to} | Subject: ${email.subject} | Status: ${email.status}`);
      });
    } else {
        console.log("data:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error fetching Resend emails:", err);
  }
}

checkEmails();
