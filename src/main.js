const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const babel = require('@babel/core')
const lang = require('./lang')

let translator

// 将object的数据源翻译
async function translateObjectSource (obj, res, from, to, mode) {
  let raw = {}
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i], item = obj[key]
    if (typeof item === 'object') {
      let child
      if (res[key]) {
        child = res[key]
      } else {
        child = {}
        res[key] = child
      }
      await translateObjectSource(item, child, from, to, mode)
    } else if (!res[key] || mode === 'o' || mode === 'd') {
      // 未翻译或模式为覆盖、差异
      // 已有翻译且模式为追加时不处理
      raw[key] = item
    }
  }
  const translation = await translator(raw, from, to)
  // 回填数据
  const tKeys = Object.keys(translation)
  for (let i = 0; i < tKeys.length; i++) {
    const key = tKeys[i]
    // 无值，模式为覆盖，模式为差异且值不同时
    if (!res[key] || mode === 'o' || (mode === 'd' && res[key] !== translation[key])) {
      res[key] = translation[key]
    }
  }
}

function getJSFileData (path) {
  const m = new module.constructor()
  m._compile(babel.transformFileSync(path, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }]
    ]
  }).code, '')
  const isDefaultExport = Object.keys(m.exports).length === 1 && m.exports.default
  return isDefaultExport ? m.exports.default : m.exports
}

(async () => {
  program
  .option('-t, --to <lang list>', 'translate to lang, split by comma, etc. en, ja, th', lang.english)
  .option('-f, --from <lang>', 'original lang', lang.chinese)
  .option('-m, --mode <mode>', 'patch mode: a(append) | o(overwrite) | d(diff)', 'a')
  .option('-o, --output <path>', 'output file directory', '.')
  .option('--overwrite <boolean>', 'overwrite origin file')
  .option('--adaptor <adaption>', 'specify translate adaptor', 'youdao')
  .option('--format <file format>', 'js|json', 'js')
  .option('--jsmodule <format>', 'es|cjs', 'es')

  program.parse()

  const options = program.opts()
  const source = program.args[0]
  try {
    translator = require('./adaptors/' + options.adaptor)
    const ext = path.extname(source)
    let data = {}
    if (ext === '.js') {
      data = getJSFileData(source)
    } else if (ext === '.json') {
      data = require(path.resolve(source))
    }
    const from = options.from,
        to = options.to.split(',').map(e => e.trim()),
        mode = options.mode

    for (let i = 0; i < to.length; i++) {
      let res = {}
      const outputFile = path.resolve(path.join(options.output, to[i] + '.' + options.format))
      // 存在则追加
      if (fs.existsSync(outputFile)) {
        res = getJSFileData(outputFile)
      }
      await translateObjectSource(data, res, from, to[i], mode)
      let prefix = ''
      if (options.format === 'js') {
        prefix = options.jsModule === 'es' ? 'export default ' : 'module.exports = '
      }
      fs.writeFileSync(outputFile, prefix + JSON.stringify(res, undefined, 2))
    }
  } catch (err) {
    console.error(err)
  }
})()
