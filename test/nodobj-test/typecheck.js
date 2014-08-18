var $ = require('../')
  , assert = require('assert');

$.import('Foundation');
assert.ok($('text').isClass === false);
assert.ok($.NSString.isClass === true);