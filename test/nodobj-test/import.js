var $ = require('../')
  //, _global = require('../lib/global')
  , assert = require('assert')

var s1 = s2 = size()
assert(!$.NSObject)
$.import('Foundation')
assert($.NSObject)
s2 = size()
assert.ok(s2 > s1)
s1 = s2
$.import('ScriptingBridge')
s2 = size()
assert.ok(s2 > s1)

function size () {
  return Object.keys($).length
}
