class B {
  toA() {
    return new A()
  }
}

module.exports = B

const A = require('./a')
