const puppeteer = require('puppeteer')
const pip = require('../pipline')
const bing = require('./bing')

const map = {
  zh: 'zh-CHS'
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function translate (raw, from, to) {
  // 有道没有转繁体，借助bing的
  if (to === 'cht') return bing(raw, from, to)
  let browser, ret
  try {
    browser = await puppeteer.launch({ headless: true })
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
    ret = await page.evaluate(el => el.textContent, res)
  } catch (err) {
    console.log('发生错误：', err)
    console.log('正在重试')
    ret = translate(raw, from, to)
  }
  browser && browser.close()
  return ret
}

// 单段翻译字数限制
const LIMIT = 4999

// 将字符用百度翻译成目标语言
module.exports = async function translator (raw, from, to) {
  return await pip(raw, translate, LIMIT, from, to)
}
