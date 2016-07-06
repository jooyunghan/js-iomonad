const {liftF, Pure, Impure} = require('./free')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ReadLine {
  constructor(cont) {
    this.cont = cont
  }
  map(f) {
    return new ReadLine(s => f(this.cont(s)))
  }
}

class PrintLine {
  constructor(s, a) {
    this.s = s
    this.a = a
  }
  map(f) {
    return new PrintLine(this.s, f(this.a))
  }
}

function readLine() {
  return liftF(new ReadLine(s => s))
}

function printLine(s) {
  return liftF(new PrintLine(s, undefined))
}

function run(free, done) {
  while (true) {
    if (free instanceof Pure) {
      done(free.a)
      break
    } else { // Impure
      let m = free.m()
      if (m instanceof ReadLine) {
        rl.once('line', (line) => run(m.cont(line), done))
        break
      } else {
        console.log(m.s)
        free = m.a // tail recursion
      }
    }
  }
}

module.exports = {
  readLine, printLine, run
}