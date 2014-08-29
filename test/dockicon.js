
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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var w = new Window();
  application.icon = 'assets/tintcompiler.png';
  application.badge = '2';
  var handler;
  setTimeout(function(){
    handler = application.attention(true);
  }, 2000);
  setTimeout(function(){
    handler.cancel();
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
  name:"DockIcon",
};