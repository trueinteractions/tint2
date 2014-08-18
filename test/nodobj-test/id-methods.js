var $ = require('../')
  , assert = require('assert')

$.import('Foundation');

assert.ok($.NSObject.methods().length > 0);
