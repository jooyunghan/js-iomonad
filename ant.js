const {liftF, resume} = require('./free')
const {Left} = require('./either')

class Read {
  constructor(next) {
    this.next = next
  }
  map(f) {
    return new Read(x => f(this.next(x)))
  }
}

class Write {
  constructor(x, next) {
    this.x = x
    this.next = next
  }
  map(f) {
    return new Write(this.x, f(this.next))
  }
}

function read() {
  return liftF(new Read(a => a))
}

function write(x) {
  return liftF(new Write(x))
}

const next = read().flatMap(x => next1(x, 1))
const next1 = (prev, count) => read().flatMap(c => 
  (c === 0) ? write2(prev, count)
  : (c === prev) ? next1(prev, count+1)
  : write2(prev, count).flatMap(() => next1(c, 1)))
const write2 = (elem, count) => write(count).flatMap(() => write(elem))

var input = [1,1,2,1]
function run(fa) {
  while (true) {
    let s = resume(fa)
    if (s instanceof Left) {
      s = s.left
      if (s instanceof Read) {
        let x = input.shift()
        fa = s.next(x || 0)
      } else { // Write
        console.log(s.x)
        fa = s.next
      }
    } else {
      return s.right
    }
  }
}

run(next)