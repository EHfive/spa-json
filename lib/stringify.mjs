function stringify(...args) {
  console.error("warn: stringify() is not implmented yet, fallback to JSON.stringify()")
  return JSON.stringify(...args)
}

export default stringify
