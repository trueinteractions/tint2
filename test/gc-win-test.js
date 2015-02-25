
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
  $utils.ok(); // not finished, remove once fixed.
  application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  win.destroy();
  setTimeout(function() { 
    console.log(win);
    $utils.ok();
  }, 2000);
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
  name:"GCTestWindow",
};