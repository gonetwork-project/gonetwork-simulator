// https://github.com/facebook/metro/tree/master/packages/metro-config/src

const blacklist = require('metro').createBlacklist
const extraNodeModules = require('node-libs-browser')

module.exports = {
  resolver: {
    extraNodeModules,
    blacklistRE: blacklist([/temp\/.*/, /src\/server\/.*/, /build\/server\/.*/])
  }
}
