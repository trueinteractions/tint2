var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

// swizzle
var dealloc = $.NSObject.getInstanceMethod('dealloc')
  , deallocCalled = false
  , origDealloc = dealloc.setImplementation(function (self, _cmd) {
      origDealloc(self, _cmd);
      deallocCalled = true
  })

var instance = $.NSObject('alloc')('init')

// 'release' the object in 1 second, [instance dealloc] should be called
setTimeout(instance.bind(instance, 'release'), 1000)

process.on('exit', function () {
  assert.ok(deallocCalled)
})
