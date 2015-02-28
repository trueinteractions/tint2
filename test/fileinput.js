
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
 * @example
 */
function run($utils) {
  $utils.ok(); // disabled for now.
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new FileInput();

  mainWindow.appendChild(input);

  input.top = 10;
  input.height = 20;
  input.left = 10;
  input.right = 10;
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
  name:"FileInput",
};