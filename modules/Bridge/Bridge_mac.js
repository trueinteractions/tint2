if(!process.bridge) process.initbridge();
if(!process.bridge.objc) process.bridge.objc = require('index');
if(!process.bridge.ref) process.bridge.ref = require('ref');