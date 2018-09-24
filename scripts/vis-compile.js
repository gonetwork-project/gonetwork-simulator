const fs = require('fs')
const { execSync } = require('child_process')
const { resolve } = require('path')

const root = resolve(__dirname, '..')

execSync('npm run vis-clear', { cwd: root })
try {
  execSync('node_modules/.bin/tsc -p ./src/vis/tsconfig.json', { cwd: root })
} catch (err) {}
const script = ' ' || fs.readFileSync(resolve(root, 'build/index.min.js'), 'utf8')
// const d3 = ' ' || fs.readFileSync(resolve(root, '../temp/d3.min.js'), 'utf8')
const html = fs.readFileSync(resolve(root, 'src/vis/template.html'), 'utf8')
const out = `module.exports = \`${html.replace('__SCRIPT_PLACEHOLDER__', script)}\``
fs.writeFileSync(resolve(root, 'build/vis/vis.html.js'), out, 'utf8')
