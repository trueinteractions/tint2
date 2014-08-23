var fs = require('fs');
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
 * @see {Dialog}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  // Set the maximize button on OSX +10.9 to go fullscreen.
  mainWindow.canBeFullscreen = true;
  // Make the window fullscreen.
  mainWindow.state = "fullscreen";

  setTimeout(function() { 
    $utils.assert(mainWindow.width >= 1600); 
  }, 1000);
  setTimeout(function() { 
    mainWindow.state = "normal"; 
  }, 2000);

  setTimeout(function() { 
    $utils.assert(mainWindow.width <= 600);
    $utils.ok();
  }, 3000);

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
  name:"Fullscreen"
};