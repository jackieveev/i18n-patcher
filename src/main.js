const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const babel = require('@babel/core')
const translator = require('./adaptors/youdao')
const lang = require('./lang')

// 将object的数据源翻译
async function translateObjectSource (obj, res, from, to, mode) {
  let raw = ''
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
      raw += item.replace(/\n/g, '') + '\n'
      res[key] = ''
    }
  }
  if (!raw) return
  const translation = await translator(raw, from, to)
  // 回填数据
  let n = 0
  const list = translation.split('\n')
  // 如果源数据和翻译后的数据条数对不上，就要修剪翻译后的数据
  // 这个问题是因为翻译后的数据人为添加了数据导致跟源数据对不上
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    // if (key !== Object.keys(res)[i]) {
    //   delete res[Object.keys(res)[i]]
    // }
    if (typeof obj[key] === 'object') continue
    console.log('@@@', key, res[key], list[n])
    // 翻译词条已经填完
    if (list[n] === undefined) break
    res[key] = list[n]
    n++
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
