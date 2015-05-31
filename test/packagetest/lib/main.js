require('Common');
var fs = require('fs');
if(process.cwd() === '/') {
	console.log('error, process.cwd returned / ');
	process.exit(5);
}
if(application.packaged && application.resource('app:///lib/main.js') === null) {
	console.log('app:///lib/main.js 1 failed.');
	fs.writeFileSync('packagebuild.result', new Buffer('1'));
	process.exit(1);
} else if(application.packaged && application.resource('app:///lib/main.js') === null) {
	console.log('app:///lib/main.js 2 failed.');
	fs.writeFileSync('packagebuild.result', new Buffer('2'));
	process.exit(2);
} else if (!application.packaged && application.resource('app:///main.js') === null) {
	console.log('app:///lib/main.js 3 failed.');
	fs.writeFileSync('packagebuild.result', new Buffer('3'));
	process.exit(3);
} else if (!application.packaged && application.resource('app://main.js') === null) {
	console.log('app:///lib/main.js 4 failed.');
	fs.writeFileSync('packagebuild.result', new Buffer('4'));
	process.exit(4);
}
fs.writeFileSync('packagebuild.result', new Buffer('0'));
process.exit(0);