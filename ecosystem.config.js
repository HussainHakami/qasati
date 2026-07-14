// PM2 Configuration for Qasati
// Used in production Docker container

export default {
  apps: [
    {
      name: "qasati",
      script: "./dist/boot.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Auto-restart on crash
      autorestart: true,
      // Restart memory limit (256MB)
      max_memory_restart: "256M",
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Don't run as daemon (required for Docker)
      daemon: false,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Health monitoring
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
