var $ = require('../');
var assert = require('assert');

$.import('Foundation');

var pool = $.NSAutoreleasePool('alloc')('init');
var errRef = $.alloc($.NSError).ref();

var str = $.NSString(
            'stringWithContentsOfFile', $('DOES_NOT_EXIST'),
            'encoding', $.NSUTF8StringEncoding,
            'error', errRef
          );

// Result of NSString method call should be `nil`
assert.ok(str === null);

var err = errRef.deref();
var domain = err('domain');
var userInfo = err('userInfo');

assert(userInfo('isKindOfClass', $.NSDictionary));
assert.equal('NSCocoaErrorDomain', domain);
assert.equal(userInfo('objectForKey', $('NSFilePath')), 'DOES_NOT_EXIST');
