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
  mainWindow.visible = true;
   mainWindow.width = 500;
   var mainScreen = Screens.active;
  // Set the maximize button on OSX +10.9 to go fullscreen.
  mainWindow.canBeFullscreen = true;
  // Make the window fullscreen.
  mainWindow.state = "fullscreen";

   setTimeout(function() { 
     $utils.assert(mainWindow.bounds.width >= mainScreen.bounds.width, 'width assertion failed: '+mainWindow.bounds.width+' != '+mainScreen.bounds.width); 
   }, 1000);
   setTimeout(function() { 
     mainWindow.state = "normal"; 
   }, 2000);
   
   setTimeout(function() { 
     $utils.assert(mainWindow.width == 500, 'main windows bounds was: ' + mainWindow.bounds.width);
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