var $ = require('../')
  , assert = require('assert')
  , gotCallback = false

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')

assert.equal($.NSGetUncaughtExceptionHandler.args.length, 0)

assert.equal($.NSSetUncaughtExceptionHandler.args.length, 1)
assert.equal($.NSSetUncaughtExceptionHandler.retval, 'v')

$.NSSetUncaughtExceptionHandler(function (exception) {
  gotCallback = true
  assert.equal(exception, 'test')
})


var handler = $.NSGetUncaughtExceptionHandler()
handler($('test'))


process.on('exit', function () {
  assert.ok(gotCallback)
})
