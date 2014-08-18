
/**
 * Test that the Node.js Buffer -> NSData casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var data = new Buffer('hello world');
var nsdata = $(data);
var bytes = nsdata('bytes');

assert(data.length === nsdata('length'));
assert(data.toString() === bytes.reinterpret(data.length).toString());
assert(bytes.hexAddress() === data.hexAddress());
