
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
 * @see {Button}
 * @example
 */
function run($utils) {
  var win = new Window();
  win.visible = true;
  var button = new Button();

  button.style = 'help';
  //button.title = '';
  win.appendChild(button);
  button.right = 100;
  button.bottom = 10;
  button.height = 20;
  button.width = 20;

  /* @hidden */ //$utils.ok();
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
  name:"HelpAndAbout",
};