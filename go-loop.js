const {run, write, go} = require('./go')
const {forever} = require('./monad')

// simple example taken from
// A Poor Man's Concurrency Monad

function loop(s) {
  return forever(write(s))
}

const example = write('start!')
  .flatMap(() => go(loop('fish')))
  .flatMap(() => loop('cat'))

run(example)