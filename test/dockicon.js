
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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var w = new Window();
  application.icon = 'assets/tintcompiler.png';
  application.badge = '2';
  setTimeout(function(){ 
    w.close();
    $utils.ok(); 
  }, 1000);
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
  name:"DockIcon",
};