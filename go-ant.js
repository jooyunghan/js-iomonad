const {run, writeln, go, chan, send, recv, close, done} = require('./go')
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

// (a -> b -> m a) -> a -> [b] -> m a
function foldM(f, z, ch) {
  return recv(ch).flatMap(v => (v === 0) ? done(z) : f(z, v).flatMap(zz => foldM(f, zz, ch)))
}

function send2(ch, a, b) {
  return send(ch, a).flatMap(() => send(ch, b))
}

function next(i, o) {
  return recv(i)
    .flatMap(prev => foldM(f, {item: prev, count: 1}, i))
    .flatMap(({item, count}) => send2(o, count, item))
    .flatMap(() => close(o))

  function f({item,count}, c) {
    return item === c ? done({item, count: count + 1})
      : send2(o, count, item).flatMap(() => done({item: c, count: 1}))
  }
}

// function next(i, o) {
//   function loop(prev, count) {
//     return recv(i).flatMap(c => {
//       if (c === 0) {
//         return send(o, count).flatMap(() => send(o, prev))
//       } else if (c === prev) {
//         return loop(prev, count + 1)
//       } else {
//         return send(o, count).flatMap(() => send(o, prev)).flatMap(() => loop(c, 1))
//       }
//     })
//   }
//   return recv(i).flatMap(prev => {
//     return loop(prev, 1)
//   }).flatMap(() => close(o))
// }

function each(ch, f) {
  return recv(ch).flatMap(v => v === 0 ? done() : f(v).flatMap(() => each(ch, f)))
}

function nth(ch, n) {
  return n === 0 ? recv(ch)
    : recv(ch).flatMap(() => nth(ch, n - 1))
}

// $ node --max-old-space-size=4096 go-ant.js
run(ant(100).flatMap(ch => nth(ch, 100)).flatMap(writeln))