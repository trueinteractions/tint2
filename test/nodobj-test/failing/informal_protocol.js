var $ = require('../../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')
var NRLock = $.NSObject.extend('NRLock')

var impl = {}
impl.lock = function lock (self, _cmd) {
  console.error('lock being called')
}
impl.unlock = function unlock (self, _cmd) {
  console.error('unlock being called')
}

NRLock.addProtocol('NSLocking', impl)

NRLock.register()

var instance = $.NRLock('alloc')('init')
instance('lock')
