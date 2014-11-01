
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
 * @see {Box}
 * @example
 */
function run($utils) {
  //TODO: Add more thorough unit tests for this.
  var win = new Window();
  win.visible = true;
  var box = new Box();

  win.appendChild(box);
  box.left = box.right = box.top = box.bottom = 20;
  box.title = "My Box";
  $utils.assert(box.title == "My Box", "Expected 'My Box' got "+box.title);
  $utils.assert(box.titlePosition == "top", "Expected 'top', but got "+box.titlePosition);
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
  name:"Box",
};