// this is a regression test for:
//   https://github.com/TooTallNate/NodObjC/issues/35

var assert = require('assert');
var $ = require('../');

$.import('Foundation');

var a = $.NSMakeRect(0, 10, 500, 550);
var b = $.NSMakeRect(20, 30, 600, 650);

// test `a`
assert.equal(a.size.width, 500);
assert.equal(a.size.height, 550);
assert.equal(a.origin.x, 0);
assert.equal(a.origin.y, 10);

// test `b`
assert.equal(b.size.width, 600);
assert.equal(b.size.height, 650);
assert.equal(b.origin.x, 20);
assert.equal(b.origin.y, 30);
