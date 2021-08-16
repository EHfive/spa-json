function stringify() {
  console.warn(
    'warn: stringify() is not implmented yet, fallback to JSON.stringify()'
  )
  return JSON.stringify.apply(null, arguments)
}

export default stringify
