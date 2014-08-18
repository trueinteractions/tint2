
/**
 * Test that the JS RegExp -> NSRegularExpression casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var regexp = /^foo(.*)$/gi;
var nsregularexpression = $(regexp);

assert(/regularexpression/i.test(nsregularexpression.getClassName()));

// TODO: add usage of `nsregularexpression` test
//var match = nsregularexpression();
