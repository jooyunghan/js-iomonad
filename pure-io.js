const {liftF, Pure, Impure} = require('./free')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Functor 
class IO {
  map(f) {}
}

class ReadLine extends IO {
  constructor(cont) {
    super()
    this.cont = cont
  }
  map(f) {
    return new ReadLine(s => f(this.cont(s)))
  }
}

class PrintLine extends IO {
  constructor(s, a) {
    super()
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

// runIO
function runIO(free, done) {
  while (true) {
    if (free instanceof Pure) {
      done(free.a)
      break
    } else if (free instanceof Impure) { // Impure
      const m = free.m() // force deferred arg TODO explicit lazy?
      if (m instanceof ReadLine) {
        rl.once('line', (line) => run(m.cont(line), done))
        break
      } else {
        console.log(m.s)
        free = m.a // tail recursion
      }
    } else { // flatMap

      

    }
  }
}

module.exports = {
  readLine, printLine, runIO
}