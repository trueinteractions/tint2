var $ = require('../'),
	assert = require('assert');

$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

// Create an NSArray with some random entries
var array = $.NSMutableArray('alloc')('init')
for (var i = 0; i<10; i++) {
  var str = $(String.fromCharCode(Math.round(Math.random()*26)+('a'.charCodeAt(0))))
  array('addObject', str)
}


// Enumerate using a Block
array('enumerateObjectsUsingBlock', $(function (self, obj, index, bool) {
	var d = array('objectAtIndex',index)('description')('UTF8String');
	var v = obj('description')('UTF8String');
	assert.equal(d,v);
}, ['v',['?', '@','I','^B']]));
