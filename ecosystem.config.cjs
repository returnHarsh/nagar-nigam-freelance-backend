module.exports = {
  apps: [{
    name: 'barnal',
    script: './server.js', // Change this to your main file (app.js, server.js, etc.)
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000, 
      XDG_RUNTIME_DIR: '/tmp/runtime-ubuntu',
      DBUS_SESSION_BUS_ADDRESS: 'unix:path=/tmp/runtime-ubuntu/bus',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser'
    }
  }]
};
