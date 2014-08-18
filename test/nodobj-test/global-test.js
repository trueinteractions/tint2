var $ = require('../global');
var assert = require('assert');

// test that global `framework()` style import works
framework('Foundation');

// test that the `NSObject` class is present
assert(NSObject, 'Cannot find global NSObject');

// test that the `$` exports also contain `NSObject`
assert($.NSObject, 'Cannot find exported NSObject');

// test that `$` is *not* the global object
foo = 'bar';
assert($.foo !== 'bar');
