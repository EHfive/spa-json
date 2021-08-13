import { parse } from '../lib/index.mjs'

console.time('parse')
const obj = parse(`

#
{
    apple = 1
    b = string1
    c = [
        2,
        string2,
        {a : 1}
    ]
    d = {
        e = 3
    }
    f: "string3"
}
`)
console.timeEnd('parse')

const str = JSON.stringify(obj, null, 2)

console.log(str)
