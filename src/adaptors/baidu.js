const puppeteer = require('puppeteer')
const pip = require('../pipline')

async function translate (raw) {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://fanyi.baidu.com/#zh/en/' + encodeURIComponent(raw))
  await new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
  await page.waitForSelector('#baidu_translate_input')
  await new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
  // await page.type('#baidu_translate_input', raw)
  await page.waitForSelector('.output-bd')
  const text = await page.$$eval(
    '.ordinary-output.target-output',
    list => list.map(el => el.textContent)
  )
  await new Promise(resolve => {
    setTimeout(resolve, 10000)
  })
  browser.close()
  return text.join('\n')
}

// 单段翻译字数限制
const LIMIT = 4999

// 将字符用百度翻译成目标语言
module.exports = async function translator (raw) {
  return await pip(raw, translate, LIMIT)
}
