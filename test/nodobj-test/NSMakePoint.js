var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var point = $.NSMakePoint(10, 1337)
assert.equal(point.x, 10)
assert.equal(point.y, 1337)
