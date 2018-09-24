const blacklist = require('metro').createBlacklist
const extraNodeModules = require('node-libs-browser')

module.exports = {
  extraNodeModules,
  getBlacklistRE: () => blacklist([/temp\/.*/, /.*\.ts/])
}
