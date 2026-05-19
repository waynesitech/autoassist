const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

module.exports = {
  apps: [
    {
      name: 'autoassist-backend',
      cwd: __dirname,
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3002',
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
        TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM || '',
        WHATSAPP_NOTIFY_PHONE: process.env.WHATSAPP_NOTIFY_PHONE || '',
        // Avoid inheriting transient CLI proxy env that breaks outbound APIs.
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        ALL_PROXY: '',
        http_proxy: '',
        https_proxy: '',
        all_proxy: '',
        SOCKS_PROXY: '',
        SOCKS5_PROXY: '',
        socks_proxy: '',
        socks5_proxy: '',
        NO_PROXY: '127.0.0.1,::1,localhost',
        no_proxy: '127.0.0.1,::1,localhost',
      },
    },
  ],
};
