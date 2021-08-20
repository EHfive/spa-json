import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { parse } from '../lib/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

assert.equal(parse('# line comment \na'), 'a')

assert.equal(parse('false'), false)

assert.equal(parse('null'), null)

assert.equal(parse('1'), 1)

// bare string
assert.equal(parse(' 1\\\\abc$ '), '1\\\\abc$')

// escape
assert.equal(parse('"\\\\"'), '\\')

// top-level array
assert.deepEqual(parse('[{ a, 1 b=2 c:3, d 4, 1 2 }, str]'), [
  { a: 1, b: 2, c: 3, d: 4, 1: 2 },
  'str',
])

// nested
assert.deepEqual(parse('{ a { b = [ c: { d 1 } f ] } }'), {
  a: { b: ['c', { d: 1 }, 'f'] },
})

var reviver = function (key, value) {
  assert(key in this)
  return key === 'd' ? null : value
}

assert.deepEqual(parse('{ a { b = [ c: { d 1 } f ] } }', reviver), {
  a: { b: ['c', { d: null }, 'f'] },
})

// native JSON
const obj = { a: { b: ['c', { d: 1 }, 'f'] } }
assert.deepEqual(parse(JSON.stringify(obj)), obj)

const conf = readFileSync(path.join(__dirname, 'pipewire.conf'))

console.time('parse conf')

const confObj = parse(conf)

console.timeEnd('parse conf')

assert.deepEqual(
  confObj,
  JSON.parse(readFileSync(path.join(__dirname, 'pipewire.conf.json')))
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

// parse(JSON.stringify(nest(5494)))
