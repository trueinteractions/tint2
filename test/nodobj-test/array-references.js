var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init');

var array = $.NSMutableArray('arrayWithCapacity', 2);
array('addObject', $.NSArray);

var nsarray = array('objectAtIndex', 0);

assert.equal(nsarray.pointer.address, $.NSArray.pointer.address)
assert.ok(nsarray === $.NSArray, 'fails strict equality test')
