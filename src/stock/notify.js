import { execFile } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Send an alert across every configured channel:
 *   - console  (always — gives `pm2 logs` a history trail)
 *   - Twilio SMS  (if TWILIO_* env vars are set) -> texts your phone
 *   - macOS notification (optional, only on a Mac)
 *
 * @param {string} title
 * @param {string} message
 * @param {string} [url]
 */
export function notify(title, message, url) {
  const full = `${title} — ${message}${url ? ` (${url})` : ''}`;
  console.log(`🔔 ${full}`);

  sendSms(`${title}\n${message}${url ? `\n${url}` : ''}`).catch((e) =>
    console.error('[notify] SMS failed:', e.message),
  );

  if (platform() === 'darwin') sendMacNotification(title, message);
}

function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM &&
      process.env.ALERT_TO_PHONE,
  );
}

/** Send an SMS via Twilio's REST API using Basic auth — no SDK required. */
async function sendSms(body) {
  if (!smsConfigured()) return;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const form = new URLSearchParams({
    To: process.env.ALERT_TO_PHONE,
    From: process.env.TWILIO_FROM,
    // SMS segments are 160 chars; trim to keep it to a single message.
    Body: body.slice(0, 320),
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Twilio ${res.status} ${res.statusText} ${detail}`.trim());
  }
}

function sendMacNotification(title, message) {
  const escaped = (s) => String(s).replace(/"/g, '\\"');
  const script = `display notification "${escaped(message)}" with title "${escaped(title)}" sound name "Glass"`;
  execFile('osascript', ['-e', script], (err) => {
    if (err) console.error('[notify] osascript failed:', err.message);
  });
}
