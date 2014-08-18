var $ = require('../');
var assert = require('assert');
var str = 'Hello Objective-C!';

$.import('Foundation');

var pool = $.NSAutoreleasePool('alloc')('init');
var nsstr = $.NSString('stringWithUTF8String', 'Hello Objective-C!');

assert.equal(str, nsstr.toString());

nsstr = nsstr('stringByAppendingString', nsstr);
assert.equal(str+str, nsstr.toString());
