var $ = require('objective-c')
var cf = require('uvcf')
var assert = require('assert')
 
var loop = cf.ref()
 
 
$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')
 
var Obj = $.NSObject.extend('Obj')
  , invokeCount = 0
 
Obj.addMethod('sel:', 'v@:@', function (self, _cmd, timer) {
  assert.equal('Info', timer('userInfo').toString())
  console.log('NSTimer invokation!', timer);
  if (++invokeCount == 5) {
    timer('invalidate')
    process.exit(0)
  }
}).register()
 
var timer = $.NSTimer('scheduledTimerWithTimeInterval', 0.5
                     ,'target', Obj('alloc')('init')
                     ,'selector', 'sel:'
                     ,'userInfo', $('Info')
                     ,'repeats', 1)
 
process.on('exit', function () {
  assert.equal(invokeCount, 5)
})
 
setInterval(function () {
  console.log('JS interval!');
}, 250);
