const debug = require('debug')('channel')
const {liftF, Impure, Pure, resume} = require('./free')
const {Left} = require('./either')

// Algebra supporting fork!

// Basic IO 

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

// Goroutine/Channel 

class Go {
  constructor(next1, next2) {
    this.next1 = next1
    this.next2 = next2
  }
  map(f) {
    // note `f` goes thru `next2` only
    return new Go(this.next1, f(this.next2))
  }
}

class MakeChan {
  constructor(next) {
    this.next = next
  }
  map(f) {
    return new MakeChan(ch => f(this.next(ch)))
  }
}

class Send {
  constructor(ch, value, next) {
    this.ch = ch
    this.value = value
    this.next = next
  }
  map(f) {
    return new Send(this.ch, this.value, f(this.next))
  }
}

class Recv {
  constructor(ch, next) {
    this.ch = ch
    this.next = next
  }
  map(f) {
    return new Recv(this.ch, a => f(this.next(a)))
  }
}

class Close {
  constructor(ch, next) {
    this.ch = ch
    this.next = next
  }
  map(f) {
    return new Close(this.ch, f(this.next))
  }
}

class Stop {
  map(f) {
    return this
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
  return write((value || "") + "\n")
}

function par(a1, a2) {
  return new Impure(new Go(a1, a2))
}

function go(a) {
  return new Impure(new Go(a, done()))
}

function stop() {
  return liftF(new Stop())
}

function chan() {
  return liftF(new MakeChan(ch => ch))
}

function send(ch, value) {
  return liftF(new Send(ch, value))
}

function recv(ch) {
  return liftF(new Recv(ch, value => value))
}

function close(ch) {
  return liftF(new Close(ch))
}

function done(c) {
  return new Pure(c)
}

function round(actions, cb) {
  while (actions.length > 0) {
    let a = actions.shift()
    let r = resume(a)
    if (r instanceof Left) {
      r = r.left
      if (r instanceof Read) {
        throw new Error("Impossible: " + r)
      } else if (r instanceof Write) {
        process.stdout.write("" + r.value)
        actions.push(r.next)
      } else if (r instanceof Go) {
        actions.push(r.next1, r.next2)
      } else if (r instanceof Stop) {
        continue
      } else if (r instanceof MakeChan) {
        let ch = { closed: false, writers: [], readers: [] }
        actions.push(r.next(ch))
      } else if (r instanceof Recv) {
        let ch = r.ch
        if (ch.closed) {
          // https://golang.org/ch/spec#Receive_operator
          // proceed immediately, yielding zero value
          actions.push(r.next(0))
          debug('recv zero value')
        } else if (ch.writers.length == 0) {
          ch.readers.push(r)
          debug('recv blocked')
        } else {
          let w = ch.writers.shift()
          let value = w.value
          actions.push(w.next)
          actions.push(r.next(value))
          debug('recv succeeded')
        }
      } else if (r instanceof Send) {
        let ch = r.ch
        if (ch.closed) {
          throw new Error('write to closed')
        } else if (ch.readers.length == 0) {
          ch.writers.push(r)
          debug('send blocked')
        } else {
          let reader = ch.readers.shift()
          let value = r.value
          actions.push(reader.next(value))
          actions.push(r.next)
          debug('send succeeded')
        }
      } else if (r instanceof Close) {
        let ch = r.ch
        ch.closed = true
        if (ch.writers.length > 0) {
          throw new Error('write to closed')
        }
        actions.push(...ch.readers.map(reader => reader.next(0)))
        ch.readers = []
        actions.push(r.next)
        debug('channel closed', ch)
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

module.exports = {
  run,
  read, write, writeln,
  go,
  chan, send, recv, close,
  done, stop
}