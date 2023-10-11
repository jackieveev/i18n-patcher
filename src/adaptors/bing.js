const puppeteer = require('puppeteer')
const lang = require('../lang')
const { upperCaseFirstChar } = require('../helpers')

const map = {
  zh: 'zh-Hans',
  cht: 'zh-Hant'
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function t (page, inputEle, src, to) {
  await page.evaluate((input) => {
    input.value = ''
  }, inputEle)
  await page.type('#tta_input_ta', src)

  const response = await page.waitForResponse(
    response => response.url().includes('https://cn.bing.com/ttranslatev3'),
    { timeout: 3000 }
  )
  const res = await response.json()
  let text = res[0]?.translations[0]?.text
  if (!text) throw new Error('翻译返回错误')
  if (to === lang.english) {
    text = upperCaseFirstChar(text)
  }
  return text
}

async function translate (raw, from, to) {
  let browser, ret = {}, page, inputEle
  try {
    browser = await puppeteer.launch({ headless: true })
    page = await browser.newPage()
    await page.goto('https://cn.bing.com/translator')

    await page.waitForSelector('#tta_srcsl')
    await page.select('#tta_srcsl', map[from] || from)

    await page.waitForSelector('#tta_tgtsl')
    await page.click('#tta_tgtsl')
    await page.select('#tta_tgtsl', map[to] || to)

    await page.waitForSelector('#tta_input_ta')
    inputEle = await page.$('#tta_input_ta')

    const keys = Object.keys(raw)
    let i = 0
    while (i < keys.length) {
      const key = keys[i]
      if (!raw[key] || /^\s+$/g.test(raw[key])) {
        ret[key] = ''
      } else {
        try {
          ret[key] = await t(page, inputEle, raw[key], to)
        } catch (err) {
          console.log('翻译字条错误：', key, ' 原内容：', raw[key])
          console.log(err)
          console.log('正在重试')
          // 随便翻译一条
          await t(page, inputEle, Date.now().toString(), to)
          continue
        }
      }
      i++
    }

  } catch (err) {
    console.log('发生错误：', err)
    console.log('正在重试')
    
    return translate(raw, from, to)
  }

  browser && browser.close()
  return ret
}

// 将字符用百度翻译成目标语言
module.exports = translate
