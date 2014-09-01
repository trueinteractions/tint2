var $ = require('..');
var assert = require('assert');
$.framework('Foundation');
$.framework('Cocoa');
var pool = $.NSAutoreleasePool('alloc')('init');
var result = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionAll, $.kCGNullWindowID);
var windowList = $.CFBridgingRelease(result);

assert(windowList.getName().toString().indexOf('Array') > -1);

pool('drain');
