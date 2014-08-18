var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')
  , array = $.NSMutableArray('arrayWithCapacity', 10)

assert.equal(array('count'), 0)
assert.equal(array.toString(), '(\n)')
