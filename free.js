var assert = require('assert')
class Free {
  static unit(a) {
    return new Pure(a)
  }
  flatMap(f) {
    return new FlatMap(this, f)
    // return f(this.a)
  }
  map(f) {
    return new FlatMap(this, (a) => new Pure(f(a)))
  }
}

class Pure extends Free {
  constructor(a) {
    super()
    this.a = a
  }
}

class Impure extends Free {
  constructor(m) {
    super()
    this.m = m
  }
}

class FlatMap extends Free {
  constructor(s, f) {
    super()
    this.s = s
    this.f = f
  }
}

function liftF(fa) {
  return new Impure(() => fa.map(a => new Pure(a)))
}

function run(free, done) {
  while (true) {
    if (free instanceof Pure) {
      done(free.a)
      break
    } else if (free instanceof Impure) { // Impure
      free.m(done)
      break
    } else { // FlatMap
      let {s, f} = free // closure
      if (s instanceof Pure) {
        free = f(s.a) // tail-recursion
      } else if (s instanceof Impure) {
        s.m(x => process.nextTick(() => run(f(x), done))) // recursion via callback
        break
      } else { // FlatMap
        free = s.s.flatMap((a) => s.f(a).flatMap(f))
      }
    }
  }
}


module.exports = {
  run, liftF, Free, Pure, Impure
}
