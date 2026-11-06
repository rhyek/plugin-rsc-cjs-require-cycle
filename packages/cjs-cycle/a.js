class A {
  toB() {
    return new B()
  }
}

module.exports = A

const B = require('./b')
