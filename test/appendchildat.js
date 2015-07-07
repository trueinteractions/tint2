
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Application');
}

function baseline() {
}

/**
 * @see {Box}
 * @example
 */
function run($utils) {
  var Window = require('Window');
  var Box = require('Box');

  var win = new Window();
  win.title = 'Should be solid red.';
  win.visible = true;

  var box = new Box();
  box.borderWidth = 2;
  box.borderColor = 'blue';
  box.backgroundColor = 'rgba(0,255,0,1)';
  box.borderRadius = 13;
  win.appendChild(box);
  box.left = box.right = box.top = box.bottom = 50;

  var box2 = new Box();
  box2.borderWidth = 2;
  box2.borderColor = 'red';
  box2.backgroundColor = 'rgba(255,0,0,1)';
  box2.borderRadius = 13;
  win.appendChild(box2);
  box2.left = box2.right = box2.top = box2.bottom = 50;

  var box3 = new Box();
  box3.borderWidth = 2;
  box3.borderColor = 'red';
  box3.backgroundColor = 'rgba(0,0,255,1)';
  box3.borderRadius = 13;
  win.appendChild(box3);
  box3.left = box3.right = box3.top = box3.bottom = 50;

  box2.moveAbove(box3);
  
  // This is a visual check, no assertions, other than hopefully no
  // crashes using appendAt.
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
  name:"AppendChildAt",
};