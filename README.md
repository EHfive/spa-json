# SPA JSON

PipeWire SPA(Simple Plugin API) JSON in JavaScript

## Install

```bash
$ # Yarn
$ yarn add spa-json
$ # or NPM
$ npm i spa-json
```

## Usage

```js
import { parse, stringify } from 'spa-json'

const obj = parse(`
context.properties = {
  core.daemon = true
  core.name = pipewire-0
  default.clock.rate = 48000
  default.clock.allowed-rates = [
    44100 48000 96000
  ]
}

context.modules = [
  # ...
]

# ...
`)

const text = stringify(obj)

// import assert from 'assert'
// assert.deepEqual(parse(text), obj)
```

The api is basically the same as [`JSON.parse()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
and [`JSON.stringify()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
except we have a `noWrap` as the 4th parameter of `stringify()` by which strips top-level wrapper `{` `}`.

For detailed documentation, see [type definitions](lib/index.d.ts).

For example usage, see [test/parse.js](test/parse.js) and [test/stringify.js](test/stringify.js).

## TODO

- [x] implement `stringify()`
- [ ] maybe add AST support for better config manipulating
