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
    return new FImpure(this.f, kcompose(this.k, f))
  }
}

function map(f) {
  return fa => fa.map(f)
}

// composition of two functions
function compose(f, g) {
  return x => f(g(x))
}

// composition of two kleisli arrows
// kcompose :: (a -> m b) -> (b -> m c) -> (a -> m c)
function kcompose(g, f) {
  return x => g(x).flatMap(f)
}

// liftFF :: f a -> FFree f a
function liftFF(f) {
  return new FImpure(f, a => new FPure(a))
}

// lifting State's operations get/put to FFree

function getFF() {
  return liftFF(get())
}

function putFF(s) {
  return liftFF(put(s))
}

// runStateFF :: FFree (State s) a -> s -> (a,s)
function runStateFF(state, s) {
  while (state instanceof FImpure) {
    let {f, k} = state
    let [a, ss] = f.run(s)
    state = k(a)
    s = ss
  }
  return [state.a, s]
}


// function getFF() {
//   return liftFF({name: 'get'})
// }

// function putFF(s) {
//   return liftFF({name: 'put', s})
// }

function runStateFF2(prog, s) {
  while (prog instanceof FImpure) {
    let {f, k} = prog
    if (f.name == 'get') {
      prog = k(s)
    } else {
      s = f.s
      prog = k()
    }
  }
  return [prog.a, s]
}

const testFF = getFF().flatMap((a) => putFF(a + 2)).flatMap(() => getFF())
console.log(runStateFF(testFF, 0))


const {forever} = require('./monad')

// function read() {
//   return liftFF({ name: 'read' })
// }

// function write(value) {
//   return liftFF({ name: 'write', value })
// }

// const prog = forever(read().flatMap(input => write('> ' + input)))

// const readline = require('./readline')
// function runRW(prog) {
//   while (true) {
//     if (prog instanceof FPure) {
//       process.exit()
//     } else {
//       let {f, k} = prog
//       if (f.name === 'read') {
//         readline(input => runRW(k(input)))
//         break
//       } else {
//         console.log(f.value)
//         prog = k()
//       }
//     }
//   }
// }

//runRW(prog)

function liftFF2(name, argNames) {
  return function (...args) {
    let f = Object.assign({ name })
    for (let i = 0; i < argNames.length; i++) {
      f[argNames[i]] = args[i]
    }
    return liftFF(f)
  }
}

const chan = liftFF2('chan', [])
const send = liftFF2('send', ['ch', 'value'])
const recv = liftFF2('recv', ['ch'])
const close = liftFF2('close', ['ch'])
const fork = liftFF2('fork', ['f'])

function roundRobin(processes) {
  while (processes.length > 0) {
    let p = processes.shift()
    if (p instanceof FPure) {
      console.log("exit with " + p.a)
    } else if (p instanceof FImpure) {
      let {f, k} = p
      switch (f.name) {
        case 'chan':
          {
            let ch = { readers: [], writers: [], closed: false }
            processes.push(k(ch))
            break
          }
        case 'send':
          {
            let {ch, value} = f
            if (ch.closed) {
              throw new Error('send to closed channel', value)
            } else if (ch.readers.length > 0) {
              let rk = ch.readers.shift()
              processes.push(k())
              processes.push(rk(value))
            } else {
              ch.writers.push({ wk: k, value })
            }
            break
          }
        case 'recv':
          {
            let {ch} = f
            if (ch.closed) {
              processes.push(k())
            } else if (ch.writers.length > 0) {
              let {wk, value} = ch.writers.shift()
              processes.push(k(value))
              processes.push(wk())
            } else {
              ch.readers.push(k)
            }
            break
          }
        case 'close':
          {
            let {ch} = f
            if (ch.closed) {
              throw new Error('close a closed channel')
            } else if (ch.writers.length > 0) {
              throw new Error('close a channel with writers')
            } else {
              processes.push(k())
              processes.push(...ch.readers.map(k => k()))
            }
            break
          }
        case 'fork':
          {
            let forked = f.f
            processes.push(k())
            processes.push(forked)
            break
          }
        default:
          throw new Error('unknown Go operation', f)
      }
    } else {
      throw new Error('unknown FFree instance', p)
    }
  }
}

function runGo(prog) {
  return roundRobin([prog])
}

const sendAndRecv = c => send(c, 1).flatMap(() => recv(c)).flatMap(n => FFree.pure(n))
const recvAndSend = c => recv(c).flatMap(n => send(c, n * 10)).flatMap(() => FFree.pure('bye~'))
const goProg = chan()
  .flatMap(c => fork(sendAndRecv(c)).flatMap(() => recvAndSend(c)))

runGo(goProg)