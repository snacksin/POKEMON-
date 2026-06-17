import 'dotenv/config';
import { notify } from './notify.js';

// Quick check that your Twilio credentials work end-to-end.
// Run with:  npm run stock:test-sms
const missing = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'ALERT_TO_PHONE']
  .filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`❌ Missing Twilio env vars: ${missing.join(', ')}`);
  console.error('   Add them to .env (see .env.example), then try again.');
  process.exit(1);
}

console.log(`Sending a test text to ${process.env.ALERT_TO_PHONE} …`);
notify('🧪 Pokémon stock-checker', 'Test alert — your SMS setup works!', 'https://www.pokemoncenter.com');

// Give the async send a moment to complete before the process exits.
setTimeout(() => console.log('Done. Check your phone (errors print above if it failed).'), 4000);
