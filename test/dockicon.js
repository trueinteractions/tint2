
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
 * @see {Application}
 * @example
 */
function run($utils) {
  var w = new Window();
  application.exitAfterWindowsClose = false;
  w.visible = true;
  application.icon = 'assets/tintcompiler.png';
  application.badge = '2';
  var handler;
  setTimeout(function(){
    handler = application.attention(true);
  }, 2000);
  setTimeout(function(){
    handler.cancel();
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
  name:"DockIcon",
};