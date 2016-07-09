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

function readLine(l) {
  if (lines.length > 0) {
    l(lines.shift())
  } else {
    listeners.push(l)
  }
}

module.exports = readLine