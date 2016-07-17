// ref: http://okmij.org/ftp/Computation/free-monad.html 

// type State s a =  s -> (a, s)
class State {
  constructor(unState) {
    this.unState = unState
  }
  run(s) {
    return this.unState(s)
  }

  // We can forget pure/map/flatMap 
  // by using FFree.
  // This is a 'profitable cheating'
  // See http://okmij.org/ftp/Computation/free-monad.html#cheating

  // static pure(a) {
  //   return new State((s) => [a, s])
  // }
  // map(f) {
  //   return new State((s) => {
  //     let [a, ss] = this.run(s)
  //     return [f(a), ss]
  //   })
  // }
  // flatMap(f) {
  //   return new State((s) => {
  //     let [a, ss] = this.run(s)
  //     return f(a).run(ss)
  //   })
  // }
}


function put(s) {
  return new State(() => [undefined, s])
}

function get() {
  return new State((s) => [s, s])
}

// const test = put(10).flatMap(() => get())
// console.log(test.run(0))

// data FFree f a where
class FFree {
  static pure(a) {
    return new FPure(a)
  }
}

// FPure :: a -> FFree f a
class FPure extends FFree {
  constructor(a) {
    super()
    this.a = a
  }
  map(f) {
    return new FPure(f(this.a))
  }
  flatMap(f) {
    return f(this.a)
  }
}

// FImpure :: f x -> (x -> FFree f a) -> FFree f a
class FImpure extends FFree {
  constructor(f, k) {
    super()
    this.f = f
    this.k = k
  }
  map(f) {
    return new FImpure(this.f, compose(map(f), this.k))
  }
  flatMap(f) {
    return new FImpure(this.f, kcompose(f, this.k))
  }
}

function map(f) {
  return fa => fa.map(f)
}

function compose(f, g) {
  return x => f(g(x))
}

function kcompose(f, g) {
  return x => g(x).flatMap(f)
}

// liftFF :: f a -> FFree f a
function liftFF(f) {
  return new FImpure(f, a => new FPure(a))
}

function getFF() {
  return liftFF(get())
}

function putFF(s) {
  return liftFF(put(s))
}

// runStateFF :: FFree (State s) a -> s -> (a,s)
function runStateFF(state, s) {
  if (state instanceof FPure) {
    let {a} = state
    return [a, s]
  } else if (state instanceof FImpure) {
    let {f, k} = state
    let [a, ss] = f.run(s)
    return runStateFF(k(a), ss)
  } else {
    throw new Error("No FFree instance", state)
  }
}

const testFF = getFF().flatMap((a) => putFF(a + 2)).flatMap(() => getFF())
console.log(runStateFF(testFF, 0))

function read() {
  return liftFF({ type: 'read' })
}

function write(value) {
  return liftFF({ type: 'write', value })
}

const {forever} = require('./monad')
const prog = forever(read().flatMap(input => write('> ' + input)))

const readline = require('./readline')
function runRW(prog) {
  while (true) {
    if (prog instanceof FPure) {
      process.exit()
    } else {
      let {f, k} = prog
      if (f.type === 'read') {
        readline(input => runRW(k(input)))
        break
      } else {
        console.log(f.value)
        prog = k()
      }
    }
  }
}

//runRW(prog)
