const {liftF, runF, Free, Pure, Impure} = require('./free')
const {IO, getLine, putStrLn} = require('./io')
const {forever} = require('./monad')

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
}

// f a -> IO a
function interpret(fa) {
  if (fa instanceof ReadLine) {
    return getLine().map(fa.f)
  } else {
    return putStrLn(fa.s).map(() => fa.a)
  }
}

function runIO(free, done) {
  toIO(free).unsafePerformIO(done)
}

let prog = readLine().flatMap(s => printLine('>' + s))
runIO(forever(prog), ()=>process.exit() )
