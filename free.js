// Free f a = Pure a |  (f (Free f a))
class Free {
  static pure(a) {
    return new Pure(a)
  }
}

class Pure extends Free {
  constructor(a) {
    super()
    this.a = a
  }
  flatMap(f) {
    return f(this.a) 
  }
  map(f) {
    return new Pure(f(this.a))
  }
}

class Impure extends Free {
  constructor(m) {
    super()
    this.m = m
  }
  flatMap(f) {
    return new Impure(() => this.m().map(a => a.flatMap(f)))
  }
  map(f) {
    return new Impure(() => this.m().map(a => a.map(f)))
  }
}

// f a -> Free f a
function liftF(fa) {
  // Impure's constructor requires a lazy arg
  return new Impure(() => fa.map(a => new Pure(a)))
}

// Free f a -> (forall b. f b -> m b) -> m a
function runF(fa, interp, monad) {
  while (true) {
    if (fa instanceof Pure) {
      return monad.pure(fa.a)
    } else {
      let m = fa.m() // force
      return interp(m).flatMap(ma => runF(ma, interp, monad))
    } 
  }
}

module.exports = {
  runF, liftF, Free, Pure, Impure
}
