const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const babel = require('@babel/core')
const translator = require('./adaptors/youdao')
const lang = require('./lang')

// 将object的数据源翻译
async function translateObjectSource (obj, res, from, to) {
  let raw = ''
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i], item = obj[key]
    if (typeof item === 'object') {
      const child = {}
      res[key] = child
      await translateObjectSource(item, child, from, to)
    } else {
      // 未翻译
      raw += item.replace(/\n/g, '') + '\n'
      res[key] = ''
    }
  }
  const translation = await translator(raw, from, to)
  // 回填数据
  let n = 0
  const list = translation.split('\n')
  keys.forEach((key) => {
    if (typeof obj[key] === 'object') return
    res[key] = list[n]
    n++
  })
}

(async () => {
  program
  .requiredOption('-s, --source <file>', 'source file path')

  program.parse()

  const babelOptions = {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current'
          }
        }
      ]
    ]
  }

  const options = program.opts()
  try {
    const ext = path.extname(options.source)
    let data = {}
    if (ext === '.js') {
      const m = new module.constructor()
      m._compile(babel.transformFileSync(options.source, babelOptions).code, '')
      const isDefaultExport = Object.keys(m.exports).length === 1 && m.exports.default
      data = isDefaultExport ? m.exports.default : m.exports
    } else if (ext === '.json') {
      console.log('hello')
    }
    const from = options.from || lang.chinese
    const to = options.to || [lang.japanese]

    for (let i = 0; i < to.length; i++) {
      const res = {}
      await translateObjectSource(data, res, from, to)
      fs.writeFileSync(path.join('./output', to[i] + '.js'), 'export default ' + JSON.stringify(res, undefined, 2))
    }
  } catch (err) {
    console.error(err)
  }
})()
