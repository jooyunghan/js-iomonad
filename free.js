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
  return new Impure(fa)
}

// Free f a -> (forall b. f b -> m b) -> m a
function runF(fa, interp, monad) {
  while (true) {
    if (fa instanceof Pure) {
      return monad.pure(fa.a)
    } else if (fa instanceof Impure) {
      return interp(fa.m)
    } else {
      return runF(runF(fa.s, interp, monad).flatMap(fa.f), interp, monad)
    }
  }
}

module.exports = {
  runF, liftF, Free, Pure, Impure
}
