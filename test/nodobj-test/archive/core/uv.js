/*
// This is a test for CF loop integration, but does not work :/ 
// Unsure the issues.

module.exports = (function() {
	var mod = {};
	mod.tick = function(self, cmd) {
	  	// 0 = enum UV_RUN_DEFAULT, 1 = UV_RUN_ONCE, 2 = UV_RUN_NOWAIT
	  	// We use UV_RUN_NOWAIT to indicate that it cannot block and should simply
	  	// spin up threads OR look for callbacks to fire.
  		this.uv_run(this.default_loop,2);
  	}.bind(mod);
	mod.register =function() {
	  	  var core = require('./core')

		  this.uv_default_loop_proc = core.process.get('uv_default_loop')
		  this.uv_run_proc = core.process.get('uv_run')

		  this.uv_default_loop = new core.ForeignFunction(this.uv_default_loop_proc, 'pointer', []);
		  this.uv_run = new core.ForeignFunction(this.uv_run_proc, 'void', ['pointer','uint8']);
		  // get a reference to node's libuv event loop
		  this.default_loop = this.uv_default_loop();
		  // the LibuvDriver class runs the libuv event loop
		  this.uv_driver = $.NSObject.extend('LibuvDriver');
		  this.uv_driver.addMethod('tick:', 'v@:@', this.tick);
		  this.uv_driver.register();
		  this.uv_driver_instance = this.uv_driver('alloc')('init');
		  // create a LibuvDriver instance add add it to the main NSRunLoop loop
		  this.nstimer =  $.NSTimer('scheduledTimerWithTimeInterval', 0.0156
		               ,'target', this.uv_driver_instance
		               ,'selector', 'tick:'
		               ,'userInfo', null
		               ,'repeats', 1);
		  //this.nstimer('setTolerance',0.55);
		  process.on('exit', function() {
		  	this;
		  	mod;
		  });
	  	}.bind(mod);
	mod.unregister = function() {
	  	if(this.uv_driver.unregister) this.uv_driver.unregister();
	  	this.nstimer('invalidate');
	  	this.nstimer('release');
	  	this.uv_driver_instance('release');
	  	delete this.uv_default_loop_proc;
	  	delete this.uv_run_proc;
	  	delete this.uv_default_loop;
	  	delete this.uv_run;
	  	delete this.default_loop;
	  	delete this.uv_driver;
	  	delete this.uv_driver_instance;
	  	delete this.nstimer;
	}.bind(mod);
	return mod;
})()
*/