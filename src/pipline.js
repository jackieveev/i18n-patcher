module.exports = async function pip (raw, translate, limit, from, to) {
  const slice = ['']
  raw.split('\n').forEach((seg) => {
    if (seg.length > limit) throw new Error('单段文字超过', limit)
    const str = slice[slice.length - 1] + seg
    if (str.length > limit) {
      slice.push(seg + '\n')
    } else {
      slice[slice.length - 1] = str + '\n'
    }
  })
  const res = []
  for (let i = 0; i < slice.length; i++) {
    res.push(await translate(slice[i].replace(/\n$/, ''), from, to))
  }
  return res.join('\n')
}