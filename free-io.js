const {liftF, runF, resume, Free, Pure, Impure} = require('./free')
const {IO, getLine, putStrLn} = require('./iomonad')
const {forever} = require('./monad')
const readline = require('./readline')
const {Left, Right} = require('./either')

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

// // runIO :: Free IO a -> IO a
// function toIO(fa) {
//   return runF(fa, interpret, IO)

//   // f a -> IO a
//   function interpret(fa) {
//     if (fa instanceof ReadLine) {
//       return getLine().map(fa.f)
//     } else {
//       return putStrLn(fa.s).map(() => fa.a)
//     }
//   }
// }

// function runIO(free, done) {
//   toIO(free).unsafePerformIO(done)
// }

// let prog = readLine().flatMap(s => printLine('>' + s))
// runIO(forever(prog), () => process.exit())


function runIO(fa) {
  while (true) {
    let f = resume(fa)
    if (f instanceof Left) {
      if (f.left instanceof ReadLine) {
        readline(s => runIO(f.left.f(s)))
        return
      } else {
        console.log(f.left.s)
        fa = f.left.a
      }
    } else {
      return
    }
  }
}

runIO(forever(readLine().flatMap(s => printLine(">" + s))))
