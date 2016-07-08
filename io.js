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

function noop() {}

class IO {
  static pure(a) {
    return new IO(cont => cont(a))    
  }
  constructor(run) {
    this.run = run
  }
  flatMap(f) {
    return new IO(cont => this.run(a => f(a).run(cont)))
  }
  map(f) {
    return this.flatMap(a => IO.pure(f(a)))
  }
  unsafePerformIO(cont = noop) {
    this.run(cont)
  }
}

function putStrLn(s) {
  return new IO(cont => {
    console.log(s)
    process.nextTick(() => {
      cont()
    })
  }) 
}

function getLine() {
  return new IO(cont => {
    readLine(line => {
      process.nextTick(() => {
        cont(line)
      })
    })
  })
}

//forever(putStrLn(3)).unsafePerformIO()
//forever(getLine().flatMap(s => putStrLn(">>>" + s + "<<<"))).unsafePerformIO()

module.exports = {
  putStrLn, getLine, IO
}