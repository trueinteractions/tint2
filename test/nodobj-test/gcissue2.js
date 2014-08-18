var $ = require('../'), 
	assert = require('assert');

$.import("Foundation");
$.import('AppKit');

// Methods will fail when the result of a previous 
// function (or method) is passed into a method directly.
// (e.g., without holding on to the variable result.)  
// This is a race condition between the V8 GC collector
// and nodobjc to see who gets to the FFI bridge first.
for(var i=0; i < 10000; i++) {
	$('')('caseInsensitiveCompare',$(' '));
}

assert.ok(true, 'This didnt segfault! Youll never see this.')