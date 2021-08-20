const t = {
  VALUE: Symbol('VALUE'),
  TEXT: Symbol('TEXT'),
}

function isUndefined(value) {
  return typeof value === 'undefined' || typeof value === 'function'
}

function stringify(value, replacer, space, noWrap) {
  if (isUndefined(value)) return undefined

  let replacerFunc
  let replacerList
  let text = ''
  let stack = [{ type: t.VALUE, key: undefined, value, level: noWrap ? -1 : 0 }]
  let next

  if (typeof replacer === 'function') {
    replacerFunc = replacer
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
        let str = JSON.stringify(next.value)
        if (str === `"${next.value}"`) {
          str = next.value
        }
        text += str + '\n'
      } else if (next.value === null) {
        text += 'null\n'
      } else if (typeof next.value.toJSON === 'function') {
        text += next.value.toJSON(next.key)
      } else if (Array.isArray(next.value)) {
        if (next.value.length) {
          const itemLevel = next.level + 1
          stack.push({ type: t.TEXT, value: ']\n', level: next.level })
          for (let i = next.value.length - 1; i >= 0; --i) {
            stack.push({
              type: t.VALUE,
              value: isUndefined(next.value[i]) ? null : next.value[i],
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
          stack = [].concat(stack, _stack)
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
      throw new TypeError()
    }
  }

  return text
}

export default stringify