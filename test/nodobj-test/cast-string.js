
/**
 * Test that the JS String -> NSString casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var str = 'hello world';
var nsstring = $(str);

assert(/string/i.test(nsstring.getClassName()));
assert(str === nsstring('UTF8String'));
