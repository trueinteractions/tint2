var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')


var array = $.NSMutableArray('alloc')('init')

assert.throws(function () {
  array('addObject', null)
})

try {
  array('addObject', null)
} catch (e) {
  assert.equal('NSInvalidArgumentException', e('name'))
  assert.ok(e.stack.length > 0)
  assert.ok(e.message.length > 0)
}

try {
  array('objectAtIndex', 100)
} catch (e) {
  assert.equal('NSRangeException', e('name'))

  assert.throws(function () {
    e('raise')
  })
}
