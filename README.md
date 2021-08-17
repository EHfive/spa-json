# SPA JSON

PipeWire SPA(Simple Plugin API) JSON in JavaScipt

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
```

## TODO

- [ ] implement `stringify()`
- [ ] maybe add AST support for better config manipulating
