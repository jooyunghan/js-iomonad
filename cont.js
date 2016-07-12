const {liftF, Impure, Pure, resume} = require('./free')
const {forever} = require('./monad')
const {Left} = require('./either')
// Algebra supporting fork!

class Read {
  constructor(next) {
    this.next = next
  }
  map(f) {
    return new Read(value => f(this.next(value)))
  }
}

class Write {
  constructor(value, next) {
    this.value = value
    this.next = next
  }
  map(f) {
    return new Write(this.value, f(this.next))
  }
}

class Fork {
  constructor(next1, next2) {
    this.next1 = next1
    this.next2 = next2
  }
  map(f) {
    return new Fork(f(this.next1), f(this.next2))
  }
}

class Stop {
  map(f) {
    return this
  }
}

class NewRef {
  constructor(next) {
    this.next = next
  }
  map(f) {
    return new NewRef(ref => f(this.next(ref)))
  }
}

class WriteRef {
  constructor(ref, value, next) {
    this.ref = ref
    this.value = value
    this.next = next
  }
  map(f) {
    return new WriteRef(this.ref, this.value, f(this.next))
  }
}

class ReadRef {
  constructor(ref, next) {
    this.ref = ref
    this.next = next
  }
  map(f) {
    return new ReadRef(this.ref, a => f(this.next(a)))
  }
}

// smart constructors

function read() {
  return liftF(new Read(value => value))
}

function write(value) {
  return liftF(new Write(value))
}

function writeln(value) {
  return write(value + "\n")
}

function par(a1, a2) {
  return new Impure(new Fork(a1, a2))
}

function fork(a) {
  return new Impure(new Fork(a, new Pure()))
}

function stop() {
  return liftF(new Stop())
}

function chan() {
  return liftF(new NewRef(ref => ref))
}

function send(ref, value) {
  return liftF(new WriteRef(ref, value))
}

function recv_(ref) {
  return liftF(new ReadRef(ref, value => value))
}

// NOTE this is not atomic operation
function recv(ref) {
  return recv_(ref)
    .flatMap(value => {
      //console.log("recv_" + value)
      return typeof value === "undefined" 
        ? recv(ref)
        : new Pure(value)})
}

function round(actions, cb) {
 // console.log(actions)
  while (actions.length > 0) {
    let a = actions.shift()
    let r = resume(a)
//    console.log(r)
    if (r instanceof Left) {
      r = r.left
      if (r instanceof Read) {
        throw new Error("Impossible: " + r)
      } else if (r instanceof Write) {
        process.stdout.write(r.value)
        actions.push(r.next)
      } else if (r instanceof Fork) {
        actions.push(r.next1, r.next2)
      } else if (r instanceof Stop) {
        throw new Error("Impossible: " + r)
      } else if (r instanceof NewRef) {
        let ref = {value: undefined}
        actions.push(r.next(ref))
      } else if (r instanceof ReadRef) {
        let ref = r.ref
        let value = ref.value
        ref.value = undefined
        actions.push(r.next(value))
      } else if (r instanceof WriteRef) {
        let ref = r.ref
        let value = r.value
        ref.value = value
        actions.push(r.next)
      } else {
        throw new Error("Impossible: " + r)
      }
    } else {
      if (cb) cb(r.right)
    }
  }
}

function run(action) {
  return round([action])
}

// following example take from
// A Poor Man's Concurrency Monad

function loop(s) {
  return forever(write(s))
}

const example = write('start!')
  .flatMap(() => fork(loop('fish')))
  .flatMap(() => loop('cat'))

// following example is taken from 
// https://talks.golang.org/2013/advconc.slide#8
// with some modification (timer)

function player(name, c) {
  return forever(recv(c)
    .flatMap(ball => {
      ball.hits++
      return writeln(`${name} ${ball.hits}`)
        .flatMap(() => send(c, ball))
    }))
}

const pingpong = chan()
  .flatMap(table => fork(player("ping", table))
    .flatMap(() => fork(player("pong", table)))
    .flatMap(() => send(table, {hits: 0})))

run(pingpong)