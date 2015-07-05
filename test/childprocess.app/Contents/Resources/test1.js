require('Common');
var assert = require('assert');
assert(process.argv.length === 2, 'The process had too many parameters: ' + JSON.stringify(process.argv));
var child = require('child_process');
var n = child.fork('test2.js' , ['hello']);
n.on('message', function(m) {
  assert(m.foo === 'bar', 'The returned message was invalid.');
  process.exit(0);
});
n.send({ hello: 'world' });


