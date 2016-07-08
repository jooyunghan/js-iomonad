// Free f a = Pure a | Impure (f (Free f a)) | FlatMap (Free f a) (a -> Free f b)
class Free {
  static pure(a) {
    return new Pure(a)
  }
  flatMap(f) {
    return new FlatMap(this, f)
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
  // override to make right-associate flatMap
  flatMap(g) {
    const {s,f} = this
    return new FlatMap(s, a => f(a).flatMap(g))
  }
  map(g) {
    const {s,f} = this
    return new FlatMap(s, a => f(a).map(g))
  }
}

// f a -> Free f a
function liftF(fa) {
  // Impure's constructor requires a lazy arg
  return new Impure(() => fa.map(a => new Pure(a)))
}

function pureF(a) {
  return new Pure(a)
}

// for now, it assumes `f a` as `(a -> b) -> b`
function runF(free, handle, done) {
  while (true) {
    if (free instanceof Pure) {
      done(free.a)
      break
    } else if (free instanceof Impure) { // Impure
      const m = free.m() // force lazy
      m.map(a => )
      break
    } else { // FlatMap
      const {s, f} = free // closure
      if (s instanceof Pure) {
        free = f(s.a) // tail-recursion
      } else if (s instanceof Impure) {
        const m = s.m() // force lazy
        f(handle(m))
        m(x => process.nextTick(() => runF(f(x), done))) // recursion via callback
        break
      } else { // FlatMap
        throw new Error("shouldn't happen left-assoicate flatMap")
      }
    }
  }
}

module.exports = {
  runF, liftF, pureF, Free, Pure, Impure
}
