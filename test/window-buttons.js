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
 * @see {Window}
 * @example
 */
function run($utils) {
  application.exitAfterWindowsClose = false;
  var w = new Window();
  w.visible = true;
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
    w.destroy();
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