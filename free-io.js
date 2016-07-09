const {liftF, runF, Free, Pure, Impure} = require('./free')
const {IO, getLine, putStrLn} = require('./iomonad')
const {forever} = require('./monad')
const readline = require('./readline')

// ReadLine (f:String -> a)
class ReadLine {
  constructor(f) {
    this.f = f
  }
  map(f) {
    return new ReadLine(line => f(this.f(line)))
  }
}

// PrintLine s a
class PrintLine {
  constructor(s, a) {
    this.s = s
    this.a = a
  }
  map(f) {
    return new PrintLine(this.s, f(this.a))
  }
}

// smart constructor by liftF-ing a functor value
function readLine() {
  return liftF(new ReadLine(s => s))
}

function printLine(s) {
  return liftF(new PrintLine(s))
}

// runIO :: Free IO a -> IO a
function toIO(fa) {
  return runF(fa, interpret, IO)

  // f a -> IO a
  function interpret(fa) {
    if (fa instanceof ReadLine) {
      return getLine().map(fa.f)
    } else {
      return putStrLn(fa.s).map(() => fa.a)
    }
  }
}

function runIO(free, done) {
  toIO(free).unsafePerformIO(done)
}

// let prog = readLine().flatMap(s => printLine('>' + s))
// runIO(forever(prog), () => process.exit())

class Id {
  static pure(a) {
    return new Id(a)
  }
  constructor(a) {
    this.a = a
  }
  flatMap(f) {
    return f(this.a)
  }
  map(f) {
    return new Id(f(this.a))
  }
}

runF(forever(printLine("Still running...")), (fa) => {
  console.log(fa.s)
  return new Id(fa.a)
}, Id)