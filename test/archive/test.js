var $ = require('./libraries/objective-c');

$.import('Foundation');
$.import('Cocoa');

var objc_pool = $.NSAutoreleasePool('alloc')('init');
var abc = $.NSMakeRect(0, 0, 500, 500);
console.log(abc);
console.log(abc.size.width);
var abcd = $.NSMakeRect(0, 0, 600, 600);
console.log(abcd);
console.log(abc.size.width);

var abcde = $.NSMakeRect(10,10,300,300);
console.log(abcde);
console.log(abc.size.width);
var foo = $.NSMakeRect(10,10,100,100);
console.log(foo);
console.log(abc.size.width);
