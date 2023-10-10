const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const babel = require('@babel/core')
const translator = require('./adaptors/youdao')
const lang = require('./lang')

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
    } else if (!res[key] || mode === 'o') {
      // 未翻译或模式为覆盖
      // 已有翻译且模式为追加时不处理
      raw[key] = item
    }
  }
  const translation = await translator(raw, from, to)
  console.log(translation)
  // 回填数据
  const tKeys = Object.keys(translation)
  for (let i = 0; i < tKeys.length; i++) {
    const key = tKeys[i]
    if (!res[key] || mode === 'o') {
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
  .requiredOption('-s, --source <file>', 'source file path')
  .option('-t, --to <lang list>', 'translate to lang, split by comma, etc. en, ja, th', lang.english)
  .option('-f, --from <lang>', 'original lang', lang.chinese)
  .option('-m, --mode <mode>', 'patch mode: a(append) | o(overwrite)', 'a')

  program.parse()

  const options = program.opts()
  try {
    const ext = path.extname(options.source)
    let data = {}
    if (ext === '.js') {
      data = getJSFileData(options.source)
    } else if (ext === '.json') {
      console.log('hello')
    }
    const from = options.from,
        to = options.to.split(',').map(e => e.trim()),
        mode = options.mode

    for (let i = 0; i < to.length; i++) {
      let res = {}
      const outputFile = path.join('./output', to[i] + '.js')
      // 存在则追加
      if (fs.existsSync(outputFile)) {
        res = getJSFileData(outputFile)
      }
      await translateObjectSource(data, res, from, to[i], mode)
      fs.writeFileSync(outputFile, 'export default ' + JSON.stringify(res, undefined, 2))
    }
  } catch (err) {
    console.error(err)
  }
})()
