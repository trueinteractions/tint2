/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

/**
 * @see {Dialog}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  /* @hidden */ mainWindow.width = 500;
  /* @hidden */ var mainScreen = Screens.active;
  // Set the maximize button on OSX +10.9 to go fullscreen.
  mainWindow.canBeFullscreen = true;
  // Make the window fullscreen.
  mainWindow.state = "fullscreen";

  /* @hidden */ setTimeout(function() { 
  /* @hidden */   $utils.assert(mainWindow.width == mainScreen.bounds.width); 
  /* @hidden */ }, 1000);
  /* @hidden */ setTimeout(function() { 
  /* @hidden */   mainWindow.state = "normal"; 
  /* @hidden */ }, 2000);
  /* @hidden */ 
  /* @hidden */ setTimeout(function() { 
  /* @hidden */   $utils.assert(mainWindow.width == 500);
  /* @hidden */   $utils.ok();
  /* @hidden */ }, 3000);

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