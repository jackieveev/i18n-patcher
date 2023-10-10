const puppeteer = require('puppeteer')
const pip = require('../pipline')

const map = {
  zh: 'zh-Hans',
  cht: 'zh-Hant'
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// TODO 加超时重试机制和其他容错
async function translate (raw, from, to) {
  let browser
  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto('https://cn.bing.com/translator')

    await page.waitForSelector('#tta_srcsl')
    await page.select('#tta_srcsl', map[from] || from)

    await page.waitForSelector('#tta_tgtsl')
    await page.click('#tta_tgtsl')
    await page.select('#tta_tgtsl', map[to] || to)

    await page.waitForSelector('#tta_input_ta')
    const inputEle = await page.$('#tta_input_ta')
    await page.evaluate((input, text) => {
      input.value = text
    }, inputEle, raw)
    await page.type('#tta_input_ta', ' ')
    await page.keyboard.press('Backspace')

    await page.waitForSelector('#tta_output_ta.tta_output_hastxt')
    await page.waitForFunction('document.getElementById("tta_output_ta").value != " ..."')
    const res = await page.$('#tta_output_ta.tta_output_hastxt')
    const text = await page.evaluate(el => el.value, res)
    browser.close()
    return text
  } catch (err) {
    console.log('发生错误：', err)
    console.log('正在重试')
    browser && browser.close()
    return translate(raw, from, to)
  }
}

// 单段翻译字数限制
const LIMIT = 2000

// 将字符用百度翻译成目标语言
module.exports = async function translator (raw, from, to) {
  return await pip(raw, translate, LIMIT, from, to)
}
