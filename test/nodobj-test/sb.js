var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
$.import('ScriptingBridge')

var pool = $.NSAutoreleasePool('new')

var bi = $.NSString('stringWithUTF8String', 'com.apple.Finder')
  , Finder = $.SBApplication('applicationWithBundleIdentifier', bi)

assert.ok(Finder.toString().indexOf('Finder') !== -1);
assert.equal('Finder', Finder('name'));
