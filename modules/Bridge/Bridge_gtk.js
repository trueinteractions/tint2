if(!process.bridge) {
	process.initbridge();
}
if(!process.bridge.ref) {
	process.bridge.ref = require('ref');
}
if(!process.bridge.struct) {
	process.bridge.struct = require('struct');
}
if(!process.bridge.ffi) {
	process.bridge.ffi = require('ffi');
}