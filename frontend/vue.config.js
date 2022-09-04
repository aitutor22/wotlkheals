const { defineConfig } = require('@vue/cli-service');

const publicPath = ((typeof process.env['NODE_ENV'] !== 'undefined') && (process.env['NODE_ENV'] === 'development')) ?
    '' : './';

module.exports = defineConfig({
  // transpileDependencies: true,
  publicPath: publicPath, // for production
})
