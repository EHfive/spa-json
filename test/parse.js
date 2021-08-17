import assert from 'assert'
import { readFileSync } from 'fs'
import { parse } from '../lib/index.js'

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

// native JSON
const obj = { a: { b: ['c', { d: 1 }, 'f'] } }
assert.deepEqual(parse(JSON.stringify(obj)), obj)

const conf = readFileSync('./test/pipewire.conf')

console.time('parse conf')

const confObj = parse(conf)

console.timeEnd('parse conf')

assert.deepEqual(confObj, JSON.parse(readFileSync('./test/pipewire.conf.json')))

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
