import 'dotenv/config';
import { Client, GatewayIntentBits, Events, Partials } from 'discord.js';
import { detectDrop } from './lib/detector.js';
import { appendDrop } from './lib/data.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Optional: only watch specific channels (comma-separated IDs). Empty = all readable channels.
const watchChannels = (process.env.MONITOR_CHANNEL_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// READ-ONLY client. These intents let the bot *receive and read* messages.
// It is never given send permissions and never calls send()/reply().
// NOTE: "Message Content Intent" must be enabled in the Discord Developer
// Portal (Bot tab) for the bot to read message text.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Read-only monitor online as ${c.user.tag}`);
  console.log(
    watchChannels.length
      ? `👀 Watching ${watchChannels.length} channel(s).`
      : '👀 Watching every channel the bot can read.'
  );
  console.log('📝 Detected drops are saved to src/data/drops.json. This bot never sends messages.');
});

client.on(Events.MessageCreate, (message) => {
  try {
    // Never react to our own account (we don't send, but be safe).
    if (message.author?.id === client.user?.id) return;

    // Optional channel allow-list.
    if (watchChannels.length && !watchChannels.includes(message.channelId)) return;

    const drop = detectDrop(message.content, {
      source: message.guild ? `#${message.channel?.name} in ${message.guild.name}` : 'a DM',
      author: message.author?.tag,
      detectedAt: message.createdAt,
    });
    if (!drop) return;

    const added = appendDrop(drop);
    if (added) {
      console.log(`🎴 New drop saved: [${drop.retailer}] ${drop.name}${drop.url ? ` -> ${drop.url}` : ''}`);
    }
  } catch (err) {
    console.error('[monitor] Error handling message:', err.message);
  }
});

client.login(token);
