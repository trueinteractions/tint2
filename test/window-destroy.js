
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
 * @see {Buttons}
 * @example
 */
function run($utils) {
  global.application.exitAfterWindowsClose = false;
  var win = new Window();
  // test the destroy with a button add.
  var btn = new Button();
  btn.left = btn.top = 0;
  btn.width = 200;
  btn.height = 50;
  btn.title = "Window Test";
  win.appendChild(btn);
  win.visible = true;

  btn.addEventListener('click', function() { 
    console.log('this shouldnt happen, its just a test to see if event callbacks are collected.');
  });
  win.addEventListener('resize', function() { 
    console.log('this shouldnt happen, its just a test to see if event callbacks are collected.');
  });
  // Give the window a cycle to attach and paint.
  setTimeout(function() {
    win.destroy();
    // Ensure the GC doesnt complain about a missing native pointer
    // reference (this at one point was an issue.)
    setTimeout(function() {
      $utils.ok();
    },250);
  },250);
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
  timeout:false,
  name:"WindowDestroy",
};