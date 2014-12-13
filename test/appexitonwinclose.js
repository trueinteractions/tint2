
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
  process.on('exit', function() {
    $utils.ok();
  });
  $utils.assert(application.exitAfterWindowsClose === true, "exitAfterWindowsClose is not true");
  application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  $utils.assert(application.exitAfterWindowsClose === false, "exitAfterWindowsClose is not false");
  application.exitAfterWindowsClose = true;
  $utils.assert(application.exitAfterWindowsClose === true, "exitAfterWindowsClose is not true");
  setTimeout(function() { win.destroy(); }, 1000);
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
  name:"ExitAppOnClose",
};