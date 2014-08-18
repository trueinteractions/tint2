var $ = require('../'),
	assert = require('assert'),
	logfile = __filename + '.log',
	fs = require('fs')

$.import('Foundation');
$.NSAutoreleasePool('alloc')('init')

fs.closeSync(2)
var fd = fs.openSync(logfile, 'w')

var base = "Hello %@ %@ %@"
	, first = "hi"
	, second = 120
	, third = 500.23423
	, expected = 'Hello hi 120 500.23423\n'
	, expected2 = 'An object: (\n    Hello\n)\n';

$.NSLog($(base), $(first), $(second), $(third));

fs.closeSync(fd);
var log = fs.readFileSync(logfile, 'utf8');
fs.unlinkSync(logfile);

assert.equal(expected, log.substring(log.length - expected.length));

fd = fs.openSync(logfile, 'w')

var arr = $.NSMutableArray('arrayWithCapacity',2);
arr('addObject', $('Hello'));
$.NSLog($("An object: %@"), arr);

fs.closeSync(fd);
log = fs.readFileSync(logfile, 'utf8');
fs.unlinkSync(logfile);

assert.equal(expected2, log.substring(log.length - expected2.length ));
