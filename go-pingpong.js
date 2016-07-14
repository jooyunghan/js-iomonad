const {run, read, write, writeln, go, chan, send, recv, close} = require('./go')
const {forever} = require('./monad')

// Pingpong example taken from 
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
  .flatMap(table => go(player("ping", table))
    .flatMap(() => go(player("pong", table)))
    .flatMap(() => send(table, { hits: 0 })))

run(pingpong)
