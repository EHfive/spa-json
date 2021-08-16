var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/index.mjs
__export(exports, {
  default: () => lib_default,
  parse: () => parse_default,
  stringify: () => stringify_default
});

// lib/parse.mjs
var s = {
  STRUCT: Symbol("STRUCT"),
  BARE: Symbol("BARE"),
  STRING: Symbol("STRING"),
  ESCAPE: Symbol("ESCAPE"),
  COMMENT: Symbol("COMMENT")
};
var Lexer = class {
  _str;
  _at;
  _len;
  _state;
  _depth;
  constructor(str) {
    this.reset(str || "");
  }
  reset(str) {
    if (str !== void 0 && str !== null) {
      this._str = str;
    }
    this._at = 0;
    this._len = this._str.length;
    this._state = s.STRUCT;
    this._depth = 0;
  }
  _ch() {
    return this._str.charAt(this._at);
  }
  _read() {
    return ++this._at;
  }
  _dump(start) {
    return {
      value: this._str.slice(start, this._at),
      start,
      end: this._at,
      depth: this._depth,
      type: this._state
    };
  }
  next() {
    let start = this._at;
    while (this._at < this._len) {
      let token;
      const ch = this._ch();
      if (this._state == s.STRUCT) {
        switch (ch) {
          case "	":
          case " ":
          case "\r":
          case "\n":
          case ":":
          case "=":
          case ",":
            break;
          case "#":
            this._state = s.COMMENT;
            break;
          case '"':
            start = this._at;
            this._state = s.STRING;
            break;
          case "[":
          case "{":
            start = this._at;
            token = this._dump(start, this._read());
            ++this._depth;
            return token;
          case "}":
          case "]":
            if (this._depth === 0) {
              throw SyntaxError();
            }
            start = this._at;
            --this._depth;
            return this._dump(start, this._read());
          default:
            start = this._at;
            this._state = s.BARE;
        }
      } else if (this._state == s.BARE) {
        switch (ch) {
          case "	":
          case " ":
          case "\r":
          case "\n":
          case ":":
          case ",":
          case "=":
          case "]":
          case "}":
            token = this._dump(start, this._at);
            this._state = s.STRUCT;
            return token;
        }
      } else if (this._state == s.STRING) {
        switch (ch) {
          case "\\":
            this._state = s.ESCAPE;
            continue;
          case '"':
            token = this._dump(start, this._read());
            this._state = s.STRUCT;
            return token;
        }
      } else if (this._state == s.ESCAPE) {
        switch (ch) {
          case '"':
          case "\\":
          case "/":
          case "b":
          case "f":
          case "n":
          case "r":
          case "t":
          case "u":
            this._state = s.STRING;
            break;
          default:
            throw SyntaxError();
        }
      } else if (this._state == s.COMMENT) {
        switch (ch) {
          case "\n":
          case "\r":
            this._state = s.STRUCT;
        }
      }
      this._read();
    }
    if (this._depth !== 0)
      throw SyntaxError();
    if (this._state == s.COMMENT) {
      return null;
    } else if (this._state != s.STRUCT) {
      const token = this._dump(start, this._at);
      this._state = s.STRUCT;
      return token;
    }
    return null;
  }
};
function convertString(str) {
  try {
    const val = JSON.parse(str);
    const type = typeof val;
    if (val === null || type === "number" || type === "boolean") {
      return val;
    }
  } catch {
  }
  return str;
}
var ParserError = class extends Error {
};
var Parser = class {
  _lexer;
  _stack = [];
  _metaStack = [];
  _token = null;
  constructor(str) {
    this._lexer = new Lexer(str && str.toString());
  }
  _reset() {
    this._lexer.reset();
    this._token = null;
  }
  _next() {
    return this._token = this._lexer.next();
  }
  _debug() {
    let token;
    while (token = this._lexer.next()) {
      console.log("  ".repeat(token.depth) + token.value);
    }
    this._lexer.reset();
  }
  _expectValue(value) {
    if (value !== this._token.value)
      throw new ParserError();
  }
  _expectType(type) {
    if (type !== this._token.type)
      throw new ParserError();
  }
  _parseObject() {
    const obj = {};
    while (this._next()) {
      if (this._token.value == "}") {
        return obj;
      }
      obj[this._parseString(false, true)] = this._parseValue(true);
    }
    return obj;
  }
  _parseArray() {
    const arr = [];
    while (this._next()) {
      if (this._token.value == "]") {
        return arr;
      }
      arr.push(this._parseValue());
    }
    return arr;
  }
  _parseTopLevel() {
    const token = this._next();
    this._reset();
    if (!token) {
      return this._parseString(true);
    }
    return this._parseObject();
  }
  _parseValue(next = false) {
    if (next && !this._next()) {
      return null;
    }
    const { value } = this._token;
    if (value === "{") {
      return this._parseObject();
    } else if (value === "[") {
      return this._parseArray();
    } else {
      return this._parseString();
    }
  }
  _parseString(next = false, isKey = false) {
    if (next && !this._next()) {
      return null;
    }
    const { value, type } = this._token;
    if (type === s.BARE) {
      return isKey ? value : convertString(value);
    } else if (type === s.STRING) {
      return JSON.parse(value);
    } else {
      throw new ParserError(JSON.stringify(this._token));
    }
  }
  parse() {
    if (!this._next())
      throw SyntaxError();
    const { value } = this._token;
    if (value === "{") {
      return this._parseObject();
    } else if (value === "[") {
      return this._parseArray();
    } else {
      return this._parseTopLevel();
    }
  }
};
function parse(str) {
  return new Parser(str).parse();
}
var parse_default = parse;

// lib/stringify.mjs
function stringify() {
  console.warn("warn: stringify() is not implmented yet, fallback to JSON.stringify()");
  return JSON.stringify.apply(null, arguments);
}
var stringify_default = stringify;

// lib/index.mjs
var SPAJSON = {
  parse: parse_default,
  stringify: stringify_default
};
var lib_default = SPAJSON;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parse,
  stringify
});