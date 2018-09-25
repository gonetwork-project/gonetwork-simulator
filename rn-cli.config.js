const blacklist = require('metro').createBlacklist
const extraNodeModules = require('node-libs-browser')

module.exports = {
  resolver: {
    extraNodeModules
  },
  getBlacklistRE: () => blacklist([/temp\/.*/, /.*\.ts/])
}
