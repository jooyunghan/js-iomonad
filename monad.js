function forever(a) {
  return a.flatMap(() => forever(a))
}

module.exports = {
  forever
}
