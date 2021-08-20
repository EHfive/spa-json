const s = {
  STRUCT: Symbol('STRUCT'),
  // bare string
  BARE: Symbol('BARE'),
  STRING: Symbol('STRING'),
  ESCAPE: Symbol('ESCAPE'),
  COMMENT: Symbol('COMMENT'),
}

class Lexer {
  _str
  _at
  _len
  _state
  _depth

  constructor(str) {
    this.reset(str || '')
  }

  reset(str) {
    if (str !== undefined && str !== null) {
      this._str = str
    }
    this._at = 0
    this._len = this._str.length
    this._state = s.STRUCT
    this._depth = 0
  }

  _ch() {
    return this._str.charAt(this._at)
  }

  _read() {
    return ++this._at
  }

  _dump(start) {
    return {
      value: this._str.slice(start, this._at),
      start,
      end: this._at,
      depth: this._depth,
      type: this._state,
    }
  }

  next() {
    let start = this._at
    while (this._at < this._len) {
      let token
      const ch = this._ch()
      if (this._state == s.STRUCT) {
        switch (ch) {
          case '\t':
          case ' ':
          case '\r':
          case '\n':
          case ':':
          case '=':
          case ',':
            break
          case '#':
            this._state = s.COMMENT
            break
          case '"':
            start = this._at
            this._state = s.STRING
            break
          case '[':
          case '{':
            start = this._at
            token = this._dump(start, this._read())
            ++this._depth
            return token
          case '}':
          case ']':
            if (this._depth === 0) {
              throw SyntaxError()
            }
            start = this._at
            --this._depth
            return this._dump(start, this._read())
          default:
            start = this._at
            this._state = s.BARE
        }
      } else if (this._state == s.BARE) {
        switch (ch) {
          case '\t':
          case ' ':
          case '\r':
          case '\n':
          case ':':
          case ',':
          case '=':
          case ']':
          case '}':
            token = this._dump(start, this._at)
            this._state = s.STRUCT
            return token
        }
      } else if (this._state == s.STRING) {
        switch (ch) {
          case '\\':
            this._state = s.ESCAPE
            continue
          case '"':
            token = this._dump(start, this._read())
            this._state = s.STRUCT
            return token
        }
      } else if (this._state == s.ESCAPE) {
        switch (ch) {
          case '"':
          case '\\':
          case '/':
          case 'b':
          case 'f':
          case 'n':
          case 'r':
          case 't':
          case 'u':
            this._state = s.STRING
            break
          default:
            throw SyntaxError()
        }
      } else if (this._state == s.COMMENT) {
        switch (ch) {
          case '\n':
          case '\r':
            this._state = s.STRUCT
        }
      }

      this._read()
    }

    if (this._depth !== 0) throw SyntaxError()

    if (this._state == s.COMMENT) {
      return null
    } else if (this._state != s.STRUCT) {
      const token = this._dump(start, this._at)
      this._state = s.STRUCT
      return token
    }

    return null
  }
}

function convertString(str) {
  try {
    const val = JSON.parse(str)
    const type = typeof val
    if (val === null || type === 'number' || type === 'boolean') {
      return val
    }
  } catch {}

  return str
}

class ParserError extends Error {}

class Parser {
  _lexer
  _reviver
  _token = null

  constructor(str, reviver) {
    this._lexer = new Lexer(str && str.toString())
    if (typeof reviver === 'function') {
      this._reviver = reviver
    }
  }

  _reset() {
    this._lexer.reset()
    this._token = null
  }

  _next() {
    // while (this._token = this._lexer.next()) {
    //   if (this._token.type === s.COMMENT)
    //     continue
    //   return this._token
    // }
    return (this._token = this._lexer.next())
  }

  _debug() {
    let token
    while ((token = this._lexer.next())) {
      console.log('  '.repeat(token.depth) + token.value)
    }
    this._lexer.reset()
  }

  _parseObject() {
    const obj = {}
    while (this._next()) {
      if (this._token.value == '}') {
        return obj
      }
      const key = this._parseString(false, true)
      const value = this._parseValue(true)
      obj[key] = value
      if (this._reviver) {
        obj[key] = this._reviver.call(obj, key, value)
      }
    }
    return obj
  }

  _parseArray() {
    const arr = []
    while (this._next()) {
      if (this._token.value == ']') {
        return arr
      }
      const key = arr.length
      const value = this._parseValue()
      arr[key] = value
      if (this._reviver) {
        arr[key] = this._reviver.call(arr, key, value)
      }
    }
    return arr
  }

  _parseTopLevel() {
    // second token
    const token = this._next()
    this._reset()

    // single non-struct value
    if (!token) {
      return this._parseString(true)
    }

    // allow omitting top-level "{" and "}"
    return this._parseObject()
  }

  _parseValue(next = false, topLevel = false) {
    if (next && !this._next()) {
      return null
    }

    const { value } = this._token
    if (value === '{') {
      return this._parseObject()
    } else if (value === '[') {
      return this._parseArray()
    } else if (topLevel) {
      return this._parseTopLevel()
    } else {
      return this._parseString()
    }
  }

  _parseString(next = false, isKey = false) {
    if (next && !this._next()) {
      return null
    }

    const { value, type } = this._token

    if (type === s.BARE) {
      return isKey ? value : convertString(value)
    } else if (type === s.STRING) {
      return JSON.parse(value)
    } else {
      throw new ParserError(JSON.stringify(this._token))
    }
  }

  parse() {
    // mock JSON.parse('')
    if (!this._next()) throw SyntaxError()

    let value = this._parseValue(false, true)
    if (this._reviver) {
      value = this._reviver.call({ '': value }, '', value)
    }
    return value
  }
}

function parse(str, reviver) {
  return new Parser(str, reviver).parse()
}

export default parse
