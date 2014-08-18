
/**
 * Test that the JS Date -> NSDate casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var date = new Date();
var nsdate = $(date);

assert(/date/i.test(nsdate.getClassName()));
assert(date.getTime() === nsdate('timeIntervalSince1970') * 1000);
