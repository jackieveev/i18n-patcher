const { program } = require('commander')
const path = require('path')
const babel = require('@babel/core')
const translator = require('./adaptors/youdao')

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

// 将object的数据源翻译
async function translateObjectSource (obj, res) {
  let raw = ''
  Object.keys(obj).forEach((key) => {
    const item = obj[key]
    if (typeof item === 'object') {
      // const child = {}
      // res[key] = child
      // translateObjectSource(item, child)
    } else {
      // 未翻译
      raw += encodeURIComponent(item) + '\n'
    }
  })
  const translation = await translator(raw)
}

const options = program.opts()
try {
  const ext = path.extname(options.source)
  let rawString = ''
  if (ext === '.js') {
    const m = new module.constructor()
    m._compile(babel.transformFileSync(options.source, babelOptions).code, '')
    const isDefaultExport = Object.keys(m.exports).length === 1 && m.exports.default
    const data = isDefaultExport ? m.exports.default : m.exports
    const res = {}
    console.log(translateObjectSource(data, res))
  } else if (ext === '.json') {
    console.log('hello')
  }
} catch (err) {
  console.error(err)
}
