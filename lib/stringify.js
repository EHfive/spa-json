const t = {
  VALUE: Symbol('VALUE'),
  TEXT: Symbol('TEXT'),
}

function isUndefined(value) {
  return typeof value === 'undefined' || typeof value === 'function'
}

const needQuote = /[\\:,=\s\[\]\{\}]/

function stringifyNonObject(value) {
  let str = JSON.stringify(value)
  if (str === 'null' || str === 'true' || str === 'false') return str
  if (!needQuote.test(str)) {
    return value
  }
  return str
}

function stringify(value, replacer, space, noWrap) {
  if (isUndefined(value)) return undefined

  let replacerFunc
  let replacerList
  let text = ''
  let stack = [{ type: t.VALUE, key: undefined, value, level: noWrap ? -1 : 0 }]
  let next

  const objMap = new WeakSet()

  if (typeof replacer === 'function') {
    replacerFunc = replacer
    value = replacerFunc.call({ '': value }, '', value)
  } else if (Array.isArray(replacer)) {
    const replacerSet = new Set()
    for (let i of replacer) {
      if (typeof i === 'string') {
        replacerSet.add(i)
      } else if (
        typeof i === 'number' ||
        i instanceof String ||
        i instanceof Number
      ) {
        replacerSet.add(String(i))
      }
    }
    replacerList = Array.from(replacerSet)
  }

  space = Math.max(Number.parseInt(space) || 0, 0)

  while ((next = stack.pop())) {
    // console.log(next)
    if (next.level > 0) {
      text += ' '.repeat(next.level * space)
    }

    if (next.type === t.TEXT) {
      text += next.value
    } else if (next.type === t.VALUE) {
      if (next.key) {
        text += next.key + ' = '
      }
      if (typeof next.value !== 'object') {
        text += stringifyNonObject(next.value) + '\n'
        continue
      } else if (next.value === null) {
        text += 'null\n'
        continue
      }

      if (objMap.has(next.value)) {
        throw new TypeError('Converting circular structure to JSON')
      }

      objMap.add(next.value)

      if (typeof next.value.toJSON === 'function') {
        text += next.value.toJSON(next.key)
      } else if (Array.isArray(next.value)) {
        if (next.value.length) {
          const itemLevel = next.level + 1
          stack.push({ type: t.TEXT, value: ']\n', level: next.level })
          for (let i = next.value.length - 1; i >= 0; --i) {
            const itemValue = replacerFunc
              ? replacerFunc.call(next.value, i, next.value[i])
              : next.value[i]

            stack.push({
              type: t.VALUE,
              value: isUndefined(itemValue) ? null : itemValue,
              level: itemLevel,
            })
          }
          stack.push({ type: t.TEXT, value: '[\n', level: 0 })
        } else {
          stack.push({ type: t.TEXT, value: '[]\n', level: 0 })
        }
      } else {
        const _stack = []
        const keys = replacerList || Object.keys(next.value)
        const itemLevel = next.level + 1

        for (let i = keys.length - 1; i >= 0; --i) {
          const key = keys[i]
          const propValue = replacerFunc
            ? replacerFunc.call(next.value, key, next.value[key])
            : next.value[key]

          if (isUndefined(propValue)) continue
          _stack.push({
            type: t.VALUE,
            key,
            value: propValue,
            level: itemLevel,
          })
        }

        if (_stack.length) {
          if (next.level >= 0) {
            stack.push({ type: t.TEXT, value: '}\n', level: next.level })
          }
          stack = stack.concat(_stack)
          if (next.level >= 0) {
            stack.push({
              type: t.TEXT,
              value: '{\n',
              level: 0,
            })
          }
        } else {
          stack.push({
            type: t.TEXT,
            value: '{}\n',
            level: 0,
          })
        }
      }
    } else {
      throw new TypeError('Should not reach')
    }
  }

  return text
}

export default stringify
