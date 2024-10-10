module.exports = {
  apps: [
    {
      name: "auth-service",
      script: "./build/server.js",
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
