var $ = require('../'), 
	assert = require('assert');

$.import("Foundation");
// Functions will fail when the result of a previous 
// function (or method) is passed into a function directly.
// (e.g., without holding on to the variable result.) 
// This is a race condition between the V8 GC collector
// and nodobjc to see who gets to the FFI bridge first.
for(var i=0; i < 10000; i++) {
	$.NSLog($(""));
}

assert.ok(true, 'This didnt segfault! Youll never see this.')