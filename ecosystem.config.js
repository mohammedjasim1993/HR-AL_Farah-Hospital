module.exports = {
  apps: [
    {
      name: "alfarrah-system",
      script: "dist/server.cjs",
      interpreter: "node",
      windowsHide: true,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
