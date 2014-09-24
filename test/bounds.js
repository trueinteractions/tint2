
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
 * @see {Control}
 * @example
 */
function run($utils) {
  // TODO: UNFINISHED!!!!!
  var win = new Window();
  var btn = new Button();

  // test bounds prior to being added.
  var nbb = btn.bounds; // should equal null
  var nbw = btn.boundsOnWindow; // should equal null
  //FAILS OSX, no exec: var nbs = btn.boundsOnScreen;

  win.x;
  win.y;
  win.width;
  win.height;

  btn.title = "Hello";
  win.appendChild(btn);
  btn.left = btn.top = 0;
  btn.width = 200;

  var wbb = win.bounds; 
  var wbw = win.boundsOnWindow;
  var wbs = win.boundsOnScreen; // = win.x, win.y, win.width, win.height

  var bbb = win.bounds;
  var bbw = win.boundsOnWindow;
  var bbs = win.boundsOnScreen;

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
  timeout:true,
  name:"BoundFrameTest",
};