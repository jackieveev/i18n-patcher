const puppeteer = require('puppeteer')
const bing = require('./bing')
const lang = require('../lang')
const path = require('path')
const { upperCaseFirstChar, formatDate } = require('../helpers')

const map = {
  zh: 'zh-CHS'
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function t (page, inputEle, src, to) {
  await page.evaluate((input) => {
    input.textContent = ''
  }, inputEle)

  await page.type('#js_fanyi_input', src)
  await page.waitForResponse(
    response => response.url().includes('https://dict.youdao.com/webtranslate'),
  )
  await page.waitForSelector('#js_fanyi_output_resultOutput')
  const res = await page.$('#js_fanyi_output_resultOutput')
  let text = await page.evaluate(el => el.textContent, res)
  if (to === lang.english) {
    text = upperCaseFirstChar(text)
  }
  return text
}

async function translate (raw, from, to) {
  if (!Object.keys(raw).length) return {}
  // 有道没有转繁体，借助bing的
  if (to === 'cht') return bing(raw, from, to)
  let browser, ret = {}, page, inputEle
  try {
    browser = await puppeteer.launch({ headless: false })
    page = await browser.newPage()
    page.setDefaultTimeout(300000)
    await page.goto('https://fanyi.youdao.com/indexLLM.html#/')
    await page.waitForSelector('.translate-tab-container')
    await page.evaluate(() => {
      // 确保目标在顶层
      var app = document.querySelector('.translate-tab-container')
      app.style.position = 'relative'
      app.style.zIndex = 2147483647
    })

    const fromBtn = '.lang-container.lanFrom-container'
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
    console.log('正在重试', raw)
    // await page.screenshot({ path: path.resolve(`./debug/youdao-${Date.now()}.png`) })
    ret = translate(raw, from, to)
  }
    
  browser && browser.close()
  return ret
}

module.exports = translate