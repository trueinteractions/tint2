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
  w.preferences.animateOnSizeChange = true;
  w.preferences.animateOnPositionChange = true;
  setTimeout(function(){ 
    w.width = 800;
    w.height = 800;
  }, 1000);
  setTimeout(function(){
    w.width = 100;
    w.height = 100;
  }, 2000);
  setTimeout(function(){
    w.x = 100;
    w.y = 100;
  }, 3000);
  setTimeout(function(){
    w.x = 900;
    w.y = 900;
  }, 4000);
  setTimeout(function(){ 
    w.close();
    $utils.ok(); 
  }, 5000);
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
  name:"WindowSizeAndPosition",
};