require('Common');
process.bridge.objc.import('Foundation');
process.bridge.objc.import('Quartz');
process.bridge.objc.import('Cocoa');
process.bridge.objc.import('AppKit');
process.bridge.objc.import('CoreGraphics');
var exec = require('child_process').exec;

var $ = process.bridge.objc;


// Click into the dead center of the screen.
var s = Screens.active.bounds;

var point = $.CGPointMake(s.width/2, s.height/2);
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));

// Send an enter command to void out any modals.
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, 52, true));
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, 52, false));
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, 36, true));
$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, 36, false));

// Finaly straw, kill off the iPhone Simulator (travis-ci builds.)
exec("killall -9 \"iPhone Simulator\"", {}, function(error,stdout,stderr) {});


setTimeout(function() { 
  var point = $.CGPointMake(728,346);
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  // a variety of hacks for travis-ci to remove error messages that sometimes popup on the desktop. 
  var point = $.CGPointMake(650,320);
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  var point = $.CGPointMake(657,339);
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  var point = $.CGPointMake(790,345);
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  var point = $.CGPointMake(725,360);
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));

},500);
// Give a second before we begin.
setTimeout(function() { process.exit(0); }, 1000);