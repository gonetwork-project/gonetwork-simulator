const fs = require('fs')
const { execSync } = require('child_process')
const { resolve } = require('path')
const Rx = require('rxjs')

const readFile = Rx.Observable.bindNodeCallback(fs.readFile)

const root = resolve(__dirname, '..')

const d3 = [
  ['dispatch', 'collection', 'array', 'timer', 'interpolate', 'path', 'color', 'ease'], // deps of direct
  ['shape', 'selection', 'axis', 'scale'], // direct deps
  ['format'],
  ['time-format', 'transition'] // mixed
]

Rx.Observable.from(d3)
  .concatMap((l) =>
    Rx.Observable.from(l)
      .map(n => resolve(root, 'node_modules', `d3-${n}`, 'dist', `d3-${n}.min.js`))
      .mergeMap(p => readFile(p, 'utf8'))
      .map(x => `<script>${x}</script>`)
  )
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

    fs.writeFileSync(resolve(root, 'build/vis/vis.html.js'), `module.exports = \`${html}\``, 'utf8')
    fs.writeFileSync(resolve(root, 'build/vis/vis.html'), html, 'utf8')
  })
