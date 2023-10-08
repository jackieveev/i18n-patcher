const puppeteer = require('puppeteer')

// 将字符用百度翻译成目标语言
module.exports = async function translator (raw) {
  const str = raw.split('\n').filter(e => e).map(e => decodeURIComponent(e)).join('\n')
  console.log('???', str)
  // const browser = await puppeteer.launch({ headless: false })
  // const page = await browser.newPage()
  // await page.goto('https://fanyi.youdao.com/')
  // await page.waitForSelector('#js_fanyi_input')
  // await page.type('#js_fanyi_input', raw)
}
