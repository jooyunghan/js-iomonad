const {run, read, write, go, chan, send, recv, close} = require('./go')
const {forever} = require('./monad')

// Look-and-say sequence
// in CSP way
 
function ant(n) {
  if (n == 0) return init()
  else return chan()
    .flatMap(o => ant(n - 1)
      .flatMap(i => go(next(i, o)))
      .flatMap(() => done(o)))
}

function init() {
  return chan()
    .flatMap(c => 
      go(send(c, 1).flatMap(() => close(c)))
      .flatMap(() => done(c)))
}

function next(i, o) {
  function loop(prev, count) {
    return recv(i).flatMap(c => {
      if (c === 0) {
        return send(o, count).flatMap(() => send(o, prev))
      } else if (c === prev) {
        return loop(prev, count + 1)
      } else {
        return send(o, count).flatMap(() => send(o, prev)).flatMap(() => loop(c, 1))
      }
    })
  }
  return recv(i).flatMap(prev => {
    return loop(prev, 1)
  }).flatMap(() => close(o))
}

function each(ch, f) {
  return recv(ch).flatMap(v => v === 0 ? done() : f(v).flatMap(() => each(ch, f)))
}

run(ant(10).flatMap(ch => each(ch, write)))