import { execFile } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Show an alert. On macOS this pops a native notification (and plays a sound).
 * Everywhere else it falls back to a clear console line so the engine still
 * works while you develop.
 */
export function notify(title, message, url) {
  // Always log too, so `pm2 logs` shows a history of hits.
  console.log(`🔔 ${title} — ${message}${url ? ` (${url})` : ''}`);

  if (platform() !== 'darwin') return;

  // AppleScript notification. osascript is built into macOS — no install needed.
  const escaped = (s) => String(s).replace(/"/g, '\\"');
  const script = `display notification "${escaped(message)}" with title "${escaped(title)}" sound name "Glass"`;
  execFile('osascript', ['-e', script], (err) => {
    if (err) console.error('[notify] osascript failed:', err.message);
  });
}
