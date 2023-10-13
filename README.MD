# i18n Patcher
```bash
npm install git+https://github.com/jackieveev/i18n-patcher -D
```

Usage
```bash
npx i18n-patcher --help
```

Options
|args|direction|
|---|---|
|-t, --to <lang list>    |translate to lang, split by comma, etc. en, ja, th (default: "en")|
|-f, --from <lang>       |original lang (default: "zh")|
|-m, --mode <mode>       |patch mode: a(append) | o(overwrite) | d(diff) (default: "a")
|-o, --output <path>     |output file directory (default: ".")
|--overwrite <boolean>   |overwrite origin file
|--adaptor <adaption>    |specify translate adaptor (default: "youdao")
|--format <file format>  |js|json (default: "js")
|--jsmodule <format>     |es\|cjs (default: "es")
|-h, --help              |display help for command

Example
```bash
npx i18n-patcher --to en,ja ./cn.js
```
Here is the file <code>./cn.js</code>
```javascript
export default {
  hello: '你好',
  world: '世界',
  i18n: '国际化',
  patcher: '补全',
  nested: {
    cool: '很酷',
    welldone: '不错'
  }
}
```

And the output
```javascript
// en.js
module.exports = {
  "nested": {
    "cool": "Very cool",
    "welldone": "Right"
  },
  "hello": "Hello",
  "world": "World",
  "i18n": "Internationalization",
  "patcher": "Complete"
}

// ja.js
module.exports = {
  "nested": {
    "cool": "かっこいいです",
    "welldone": "そうです"
  },
  "hello": "こんにちは",
  "world": "世界です",
  "i18n": "国際化です",
  "patcher": "補完します"
}
```
