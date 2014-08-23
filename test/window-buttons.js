/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
}

function baseline() {
}

/**
 * @see {Window}
 * @example
 */
function run($utils) {
  var w = new Window();
  w.maximizeButton = true;
  w.minimizeButton = false;
  w.closeButton = false;
  w.resizable = false;
  w.titleVisible = false;

  setTimeout(function(){ 
    w.minimizeButton = true;
  }, 1000);
  setTimeout(function(){ 
    w.closeButton = true;
  }, 2000);
  setTimeout(function(){ 
    w.resizable = true;
  }, 3000);
  setTimeout(function(){ 
    w.close();
    $utils.ok(); 
  }, 4000);
}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  name:"WindowButtons",
};