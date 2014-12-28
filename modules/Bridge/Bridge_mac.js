if(!process.bridge) {
	process.initbridge();
}
if(!process.bridge.objc) {
	process.bridge.objc = require('index');
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
