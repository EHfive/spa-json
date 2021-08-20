import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync } from 'fs'
import { parse, stringify } from '../lib/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// pure value
assert.equal(stringify(null), 'null\n')
assert.equal(stringify(1), '1\n')
assert.equal(stringify('string'), 'string\n')

// undefined
assert.equal(stringify(undefined), undefined)
assert.equal(
  stringify(function () {}),
  undefined
)

//
// replacer function
//
function replacer(key, value) {
  assert(key in this)
  return key !== 'skipped' && +key !== 1 ? value : undefined
}

var text = stringify(
  {
    a: 1,
    skipped: 'skipped',
    b: [1, 2, undefined, { c: false, skipped: 'skipped' }],
  },
  replacer,
  2
)

var expected = `\
{
  a = 1
  b = [
    1
    null
    null
    {
      c = false
    }
  ]
}
`

assert.deepEqual(text, expected)

//
// replacer array
//
var replacerList = ['a', 'b']

var text = stringify(
  {
    a: 1,
    skipped1: 233,
    b: [111, 2, undefined, { skipped2: false, skipped3: 'skipped' }],
  },
  replacerList,
  2,
  true
)

var expected = `\
a = 1
b = [
  111
  2
  null
  {}
]
`

assert.deepEqual(text, expected)

//
// PipeWire configuration file
//
var confObj = JSON.parse(
  readFileSync(path.join(__dirname, 'pipewire.conf.json'))
)

var confText = readFileSync(path.join(__dirname, 'pipewire.conf'))

console.time('stringify')

var text = stringify(confObj, null, 4, true)

console.timeEnd('stringify')

// writeFileSync(path.join(__dirname, 'pipewire.conf.json.conf'), text)

var expected = readFileSync(
  path.join(__dirname, 'pipewire.conf.json.conf')
).toString()

assert.equal(text, expected)

assert.deepEqual(parse(text), confObj)

assert.deepEqual(parse(text), parse(confText))

//
// Throws on circular structure
//
var circular = {}

circular.nested = {
  circular,
}

assert.throws(
  () => stringify(circular),
  /Converting circular structure to JSON$/
)

function nest(level) {
  const root = []
  let next = root
  for (let i = 0; i < level; ++i) {
    next[0] = []
    next = next[0]
  }
  return root
}

// stringify(nest(7000000))
