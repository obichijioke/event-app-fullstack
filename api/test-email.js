require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing SMTP configuration...\n');

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  };

  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Pass: ${config.pass ? '***' + config.pass.slice(-4) : 'NOT SET'}`);
  console.log(`  From: ${config.from}`);
  console.log('');

  if (!config.host || !config.port || !config.user || !config.pass || !config.from) {
    console.error('❌ Missing SMTP configuration!');
    console.log('\nRequired environment variables:');
    console.log('  - SMTP_HOST');
    console.log('  - SMTP_PORT');
    console.log('  - SMTP_USER');
    console.log('  - SMTP_PASS');
    console.log('  - SMTP_FROM');
    process.exit(1);
  }

  const secure = config.port === 465;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    ...((!secure && config.port !== 25) && {
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
      }
    }),
  });

  console.log(`Connection type: ${secure ? 'SSL' : 'STARTTLS'}\n`);

  // Test connection
  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }

  // Send test email
  console.log('Sending test email...');
  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: 'test@example.com', // Mailtrap will capture this
      subject: 'Test Email from EventFlow',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify SMTP configuration.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log('\n✨ Email configuration is working correctly!');
    console.log('   Check your Mailtrap inbox to see the test email.');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEmail().catch(console.error);
