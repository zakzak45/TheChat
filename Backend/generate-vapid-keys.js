const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your environment variables:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n=== End of VAPID Keys ===\n');
console.log('For local development, add these to a .env file in the Backend directory.');
console.log('For production (Render), add these as environment variables in your Render dashboard.\n');
