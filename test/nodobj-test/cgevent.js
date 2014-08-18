// Unit test for:
// https://github.com/TooTallNate/NodObjC/issues/36

var $ = require('../');
var assert= require('assert');

$.framework('Cocoa')

var pool = $.NSAutoreleasePool('alloc')('init')

var count = 0;

var interval = setInterval(function () {
  count++;
  if (count == 1000) {
    clearInterval(interval);
    return;
  }
  var moveEvent = $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, $.CGPointMake(1, 1), 0);
  $.CGEventPost($.kCGHIDEventTap, moveEvent);

}, .00000000001)

pool('drain');
assert.ok(true, 'This didnt segfault! And youll never see this.');
