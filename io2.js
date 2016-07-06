const { run, Impure, Pure } = require('./free')


var lines = []
var listeners = []
var buffer = ""

function emitLine(line) {
  if (listeners.length > 0) {
    listeners.shift()(line)
  } else {
    lines.push(line)
  }
}

process.stdin.on('data', (data) => {
  buffer = buffer + data.toString()
  var i = 0, newline
  while ((newline = buffer.indexOf('\n', i)) != -1) {
    emitLine(buffer.slice(i, newline))
    i = newline + 1
  }
  buffer = buffer.slice(i)
})

function listen(l) {
  if (lines.length > 0) {
    l(lines.shift())
  } else {
    listeners.push(l)
  }
}

//
function printLine(s) {
  return new Impure(cont => cont(console.log(s)))
}

function readLine() {
  return new Impure(cont => listen(cont))
}

function forever(a) {
  return a.flatMap(() => forever(a))
}

var prog1 = forever(printLine(2))
var echo = readLine().flatMap(s => printLine(">>>" + s + "<<<"))

run(forever(echo))