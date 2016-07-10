
class Id {
  static pure(a) {
    return new Id(a)
  }
  constructor(a) {
    this.a = a
  }
  flatMap(f) {
    return f(this.a)
  }
  map(f) {
    return new Id(f(this.a))
  }
}

module.exports = Id