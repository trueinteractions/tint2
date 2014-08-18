// this is a regression test for:
//   https://github.com/TooTallNate/NodObjC/issues/42

var assert = require('assert');
var $ = require('../');
var core = require('../lib/core.js');

$.import('Foundation');

var MyClass = $.NSObject.extend('MyClass');

MyClass.addMethod('init:','v@:@', function(self, sel, obj) {
	return self;
});
MyClass.addMethod('onlyAcceptsObjects:','v@:@', function(self, sel, obj) {
	// If this runs, it will segfault, hopefully internally we'll kick out an
	// error message before this does.
	console.log(obj);
	assert.ok(false, 'How did we get here? Normally this seg faults on the line above.');
});
MyClass.register();

var MyInstance = MyClass('alloc')('init');
var rect = $.NSMakeRect(0,0,100,100);
// Fake an ID by passing in type:@ and the pointer only.  This is what
// happens when we receive an object created by objective-c that was
// never in javascript.
var success = false;
try {
	MyInstance('onlyAcceptsObjects',{pointer:rect['ref.buffer'],type:'@'});
} catch(e) {
	if(e instanceof TypeError) success = true;
}
assert.ok(success, 'We failed to ensure that simple types cannot be represented as id.');