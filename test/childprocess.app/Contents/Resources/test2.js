var assert = require('assert');
assert(process.argv[2] === 'hello', 'Hello did not fire.');
process.on('message', function(m) {
	assert(m.hello === 'world', 'The message recieved was invalid.');
	process.send({ foo: 'bar' });
	setTimeout(function() {
		process.exit(0);
	},200);
});
