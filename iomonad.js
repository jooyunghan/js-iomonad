const readline = require('./readline')

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
    readline(line => {
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