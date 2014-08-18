var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var rect = $.NSMakeRect(1,2,3,4);
assert.equal(rect.origin.x, 1)
assert.equal(rect.origin.y, 2)
assert.equal(rect.size.width, 3)
assert.equal(rect.size.height, 4)
