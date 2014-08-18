
/**
 * Test that the JS Number -> NSNumber casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var num = Math.PI;
var nsnumber = $(num);

assert(/number/i.test(nsnumber.getClassName()));
assert(num === nsnumber('doubleValue'));
