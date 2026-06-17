// pm2 process config — start with: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'pokemon-bot',
      script: 'src/index.js',
      // Restart the bot if it crashes; back off if it crash-loops.
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // Don't restart on file changes in production.
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'pokemon-stock',
      script: 'src/stock/index.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
