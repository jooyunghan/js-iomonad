const {Left, Right} = require('./either')
// Free f a = Pure a | Impure (f a) | FlatMap (Free f a) (a -> Free f b)
class Free {
  static pure(a) {
    return new Pure(a)
  }
  flatMap(f) {
    return new FlatMap(this, f)
  }
  map(f) {
    return this.flatMap(a => Free.pure(f(a)))
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

// f a -> Free f a
function liftF(fa) {
  return new Impure(fa.map(a => new Pure(a)))
}

// Free f a -> (forall b. f b -> m b) -> m a
function runF(fa, interp, monad) {
  while (true) {
    if (fa instanceof Pure) {
      return monad.pure(fa.a)
    } else if (fa instanceof Impure) {
      return interp(fa.m)
    } else {
      let {s,f} = fa   // s:: Free f b, f::b -> Free f a 
      if (s instanceof Pure) {
        let {a} = s    // a:: b
        fa = f(a)
      } else if (s instanceof Impure) {
        let {m} = s    // m:: f b
        return interp(m).flatMap(b => runF(f(b), interp, monad)) // can't make it as tailrec
      } else {
        let s0 = s.s
        let f0 = s.f
        fa = s0.flatMap(b => f0(b).flatMap(f))
      }
    }
  }
}

function resume(fa) {
  while (true) {
    if (fa instanceof Pure) {
      return new Right(fa.a)
    } else if (fa instanceof Impure) {
      return new Left(fa.m)
    } else {
      let {s,f} = fa
      if (s instanceof Pure) {
        if (typeof f !== 'function') console.log("not a function", fa)
        fa = f(s.a)
      } else if (s instanceof Impure) {
        return new Left(s.m.map(b => b.flatMap(f)))
      } else {
        let s0 = s.s
        let f0 = s.f
        fa = s0.flatMap(b => f0(b).flatMap(f))
      }
    }
  }
}

module.exports = {
  runF, liftF, Free, Pure, Impure, resume
}
