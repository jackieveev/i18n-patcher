const puppeteer = require('puppeteer')
const bing = require('./bing')
const lang = require('../lang')

const map = {
  zh: 'zh-CHS'
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


async function translate (raw, from, to) {
  // 有道没有转繁体，借助bing的
  if (to === 'cht') return bing(raw, from, to)
  let browser, ret = {}, page, inputEle
  try {
    browser = await puppeteer.launch({ headless: false })
    page = await browser.newPage()
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
    inputEle = await page.$('#js_fanyi_input')
    
    const keys = Object.keys(raw)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      await page.evaluate((input, text) => {
        input.textContent = text
      }, inputEle, raw[key])

      await page.type('#js_fanyi_input', ' ')
      await page.keyboard.press('Backspace')
      await page.waitForResponse(response => response.url().includes('https://dict.youdao.com/webtranslate'))
      await sleep(100)
      await page.waitForSelector('#js_fanyi_output_resultOutput')
      const res = await page.$('#js_fanyi_output_resultOutput')
      let text = await page.evaluate(el => el.textContent, res)
      if (to === lang.english) {
        text = text.charAt(0).toUpperCase() + text.slice(1)
      }
      ret[key] = text
    }

  } catch (err) {
    console.log('发生错误：', err)
    console.log('正在重试')
    return translate(raw, from, to)
  }

    
  browser && browser.close()
  return ret
}

module.exports = translate