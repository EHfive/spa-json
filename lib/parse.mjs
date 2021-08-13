class Token {
  constructor(type,) {
    return {
      type,

    }
  }
}

function noop() {
}

const log = process.env.NODE_ENV === 'development' ? console.log : noop

class Parser {
  #position = 0
  #line = 1
  #column = 0
  #stack = []
  #root = null
  #src
  #next
  #nextNext
  #buffer
  #key

  constructor(str, isConf) {
    this.#src = str;
    this.#next = this.#readDefault
    if (isConf) {
      this.#pushStruct({})
    }
  }

  get #char() {
    return this.#src[this.#position]
  }

  #read() {
    const ch = this.#char

    if (ch === '\n') {
      this.#position++
      this.#line++
      this.#column = 0
    } else if (ch) {
      this.#position++
      this.#column += ch.length
    } else {
      this.#column++
    }

    return ch
  }

  #readDefault() {
    switch (this.#char) {
      case '\t':
      case '\v':
      case '\f':
      case ' ':
      case '\u00A0':
      case '\uFEFF':
      case '\n':
      case '\r':
      case '\u2028':
      case '\u2029':
      case ':':
      case '=':
      case ',':
      case '"':
        this.#read()
        break
      case '#':
        this.#next = this.#readComment
        this.#read()
        break
      default:
        if (this.#nextNext) {
          this.#next = this.#nextNext
        } else {
          this.#next = this.#readValue
        }
    }
  }

  #readComment() {
    switch (this.#char) {
      case '\n':
      case '\r':
      case '\u2028':
      case '\u2029':
        this.#next = this.#readDefault
        this.#read()
        break
      default:
        this.#read()
    }
  }

  #setValue(val) {
    const parent = this.#stack[this.#stack.length - 1]

    if (!parent) {
      this.#root = val
    } else if (Array.isArray(parent)) {
      parent.push(val)
      log(`[${parent.length - 1}] = ${JSON.stringify(val)}`)
      this.#nextNext = this.#readArray
    } else {
      // if (parent.hasOwnProperty(this.#key))
      //   throw SyntaxError()
      parent[this.#key] = val
      log(`setValue: ${this.#key} = ${JSON.stringify(val)}`)
      this.#key = ''
      this.#nextNext = this.#readObject
    }
  }

  #pushStruct(val) {
    this.#setValue(val)

    this.#stack.push(val)
    this.#nextNext = Array.isArray(val) ? this.#readArray : this.#readObject
    log(this.#stack)
  }

  #popStruct() {
    const val = this.#stack.pop()
    const curr = this.#stack[this.#stack.length - 1]

    log(val, curr)

    if (!curr) {
      this.#nextNext = undefined
    } else if (Array.isArray(curr)) {
      this.#nextNext = this.#readArray
    } else {
      this.#nextNext = this.#readObject
    }
  }

  #readValue() {
    switch (this.#char) {
      case '{':
        this.#next = this.#readDefault
        this.#pushStruct({})
        return this.#read()
      case '[':
        this.#next = this.#readDefault
        this.#pushStruct([])
        return this.#read()
      case '\t':
      case '\v':
      case '\f':
      case ' ':
      case '\u00A0':
      case '\uFEFF':
      case '\n':
      case '\r':
      case '\u2028':
      case '\u2029':
      case ',':
      case '}':
      case ']':
      case '"':
        this.#next = this.#readDefault
        this.#setValue(this.#buffer)
        return this.#buffer
    }
    this.#buffer += this.#read()
  }

  #readPropName() {
    switch (this.#char) {
      case '\t':
      case '\v':
      case '\f':
      case ' ':
      case '\u00A0':
      case '\uFEFF':
      case '\n':
      case '\r':
      case '\u2028':
      case '\u2029':
      case '#':
      case ':':
      case '=':
        this.#next = this.#readDefault
        this.#nextNext = this.#readObject
        this.#key = this.#buffer
        this.#buffer = ''
        return this.#key
    }
    this.#buffer += this.#read()
  }

  #readObject() {
    switch (this.#char) {
      case '}':
        this.#next = this.#readDefault
        this.#popStruct()
        return this.#read()
    }

    this.#next = this.#readDefault
    this.#buffer = ''
    this.#nextNext = this.#key ? this.#readValue : this.#readPropName
    // log(`readObject:${this.#read()}`)
  }

  #readArray() {
    switch (this.#char) {
      case ']':
        this.#next = this.#readDefault
        this.#popStruct()
        return this.#read()
    }
    this.#next = this.#readDefault
    this.#nextNext = this.#readValue
    this.#buffer = ''
  }

  #nextToken() {
    let token = null
    while (this.#position < this.#src.length) {
      const pre = this.#next
      if (typeof this.#next === 'function') {
        token = this.#next()
      }

      if (token) {
        log(`${pre.name} -> ${this.#next.name} line:${this.#line}, col:${this.#column}, token:${token}`)
      }
    }
  }

  parse() {
    this.#nextToken()
    return this.#root
  }
}

function parse(str, isConf=false) {
  return new Parser(str, isConf).parse()
}

export default parse
