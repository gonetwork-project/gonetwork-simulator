const fs = require('fs')
const { execSync } = require('child_process')
const { resolve } = require('path')
const Rx = require('rxjs')

const readFile = Rx.Observable.bindNodeCallback(fs.readFile)

const root = resolve(__dirname, '..')

const d3 = ['d3-shape', 'd3-transition', 'd3-format', 'd3-selection', 'd3-axis', 'd3-scale']
Rx.Observable.from(d3)
  .map(n => resolve(root, 'node_modules', `${n}`, 'dist', `${n}.min.js`))
  .mergeMap(p => readFile(p, 'utf8'))
  .map(x => `<script>${x}</script>`)
  .toArray()
  .map(x => x.join('\n'))
  .subscribe(d3 => {
    execSync('npm run vis-clear', { cwd: root })
    try {
      execSync('node_modules/.bin/tsc -p ./src/vis/tsconfig.json', { cwd: root })
    } catch (err) { }
    // execSync(`webpack index.js -o index.min.js`, { cwd: resolve(root, 'build/vis') })
    // const script = fs.readFileSync(resolve(root, 'node_modules/d3-selection/dist/d3-selection.min.js'), 'utf8')
    const script = fs.readFileSync(resolve(root, 'build/vis/index.js'), 'utf8')
    // const d3 = ' ' || fs.readFileSync(resolve(root, '../temp/d3.min.js'), 'utf8')
    const html = fs.readFileSync(resolve(root, 'src/vis/template.html'), 'utf8')
      .replace('__D3_PLACEHOLDER__', d3)
      .replace('__SCRIPT_PLACEHOLDER__', script)
    const out = `module.exports = \`${html}\``
    // fs.writeFileSync(resolve(root, 'build/vis/index.min.js'), `module.exports = \`${script}\``, 'utf8')
    fs.writeFileSync(resolve(root, 'build/vis/vis.html.js'), out, 'utf8')
  })
