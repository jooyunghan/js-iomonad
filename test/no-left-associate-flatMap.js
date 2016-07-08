const {expect} = require('chai')
const {liftF, runF} = require('../free')

class Cont {
  constructor(cont) {
    this.cont = cont
  }
  map(f) {
    return new Cont(a => this.cont(f(a)))
  }
}

describe('free', function () {
  it ('pureF', function (done) {
    runF(pureF(2), a => {
      expect(a).eql(2)
      done()
    })
  })
  it('map', function (done) {
    const p = pureF(2) 
    const q = p.map(n => n + n) // 4
    runF(q, a => {
      expect(a).eql(4)
      done()
    })
  })
  it('flatMap', function (done) {
    const p = pureF(2) 
    const q = p.flatMap(n => pureF(n + n)) // 4
    runF(q, a => {
      expect(a).eql(4)
      done()
    })
  })
})