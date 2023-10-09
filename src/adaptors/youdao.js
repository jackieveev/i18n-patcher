const puppeteer = require('puppeteer')
const pip = require('../pipline')
const lang = require('../lang')

const map = {
  zh: 'zh-CHS'
}

async function translate (raw, from, to) {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://fanyi.youdao.com/')

  const fromBtn = '.languageSelector.languageSelector-web'
  await page.waitForSelector(fromBtn)
  await page.click(fromBtn)
  await page.waitForSelector('.languageInterface')
  await page.click(`div[data-code="${map[from] || from}"]`)

  const toBtn = '.lang-container.lang-container1.lanTo-container'
  await page.waitForSelector(toBtn)
  await page.click(toBtn)
  await page.waitForSelector('.languageInterface')
  await page.click(`div[data-code="${map[to] || to}"]`)

  await page.waitForSelector('#js_fanyi_input')
  const inputEle = await page.$('#js_fanyi_input')
  await page.evaluate((input, text) => {
    input.textContent = text
  }, inputEle, raw)
  await page.type('#js_fanyi_input', ' ')
  await page.keyboard.press('Backspace')
  await page.waitForSelector('#js_fanyi_output_resultOutput')
  const res = await page.$('#js_fanyi_output_resultOutput')
  const text = await page.evaluate(el => el.textContent, res)
  browser.close()
  return text
}

// 单段翻译字数限制
const LIMIT = 4999

// 将字符用百度翻译成目标语言
module.exports = async function translator (raw, from, to) {
  return await pip(raw, translate, LIMIT, from, to)
}
