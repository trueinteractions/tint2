var $ = require('../');
var fs = require('fs');
var assert = require('assert');
var logfile = __filename + '.log';

$.import('Foundation');
var pool = $.NSAutoreleasePool('alloc')('init');

fs.closeSync(2);
var fd = fs.openSync(logfile, 'w');

// The result of NSLog() will be written to `logfile`
$.NSLog($('test'));

var array = $.NSMutableArray('alloc')('init');
array('addObject', $('foobar'));
$.NSLog($("An object: %@, an NSNumber: %@"), array, $(13.3));

fs.closeSync(fd);
var log = fs.readFileSync(logfile, 'utf8');
fs.unlinkSync(logfile);

if (! /^.* test\s*.* An object\: \(\s*foobar\s*\), an NSNumber\: 13.3\s*$/.test(log)) {
  console.log('failed :(');
  process.exit(1);
}
