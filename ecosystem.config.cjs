module.exports = {
  apps: [
    {
      name: 'ipbook',
      port: '3100',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
