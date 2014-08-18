// Unit test for https://github.com/TooTallNate/NodObjC/issues/31
var $ = require('../'), assert = require('assert');
$.import('Foundation');

// loose equality tests
assert.equal($.NSNumber('numberWithBool', true), 1);
assert.equal($.NSNumber('numberWithBool', false), 0);
assert.equal($('Y')('boolValue'),true);
assert.equal($('N')('boolValue'),false);
assert.equal($.NSString('stringWithString', $('Y'))('boolValue'),1);
assert.equal($.NSString('stringWithString', $('N'))('boolValue'),0);

// get a little closer
assert.equal($.NSNumber('numberWithBool', true).toString(), "1");
assert.equal($.NSNumber('numberWithBool', false).toString(), "0");
assert.equal($('Y')('boolValue').toString(),"true");
assert.equal($('N')('boolValue').toString(),"false");
assert.equal($.NSString('stringWithString', $('Y'))('boolValue').toString(),"true");
assert.equal($.NSString('stringWithString', $('N'))('boolValue').toString(),"false");

// strict equality tests
// TODO: Support NSDecimal
//assert.ok($.NSNumber('numberWithBool', true)('decimalValue') === 1);
//assert.ok($.NSNumber('numberWithBool', false)('decimalValue') === 0);
assert.ok($('Y')('boolValue') === true);
assert.ok($('N')('boolValue') === false);
assert.ok($.NSString('stringWithString', $('Y'))('boolValue') === true);
assert.ok($.NSString('stringWithString', $('N'))('boolValue') === false);
