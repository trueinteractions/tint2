
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
  var $ = process.bridge.dotnet;
  var $$ = process.bridge;
  var win = new Window();
  win.visible = true;
  var control = new Container();
  win.appendChild(control);
  $utils.ok();
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
  name:"GenericView",
};

