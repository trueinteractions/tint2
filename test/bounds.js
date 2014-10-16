
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
  win.visible = true;
  var btn = new Button();

  var btnMargin = new Button();
  win.appendChild(btnMargin);
  btnMargin.left = btnMargin.right = 10;
  btnMargin.middle = '75%';

  //$utils.assert(btnMargin.bounds.width == (win.bounds.width - 20), 
  //  'btnMargin.bounds.width['+btnMargin.bounds.width+'] != win.bounds.width - 20 ['+(win.bounds.width - 20)+']');

  // test bounds prior to being added.
  var nbb = btn.bounds; 
  $utils.assert(nbb == null);
  var nbw = btn.boundsOnWindow;
  $utils.assert(nbw == null);
  var nbs = btn.boundsOnScreen;
  $utils.assert(nbs == null);

  btn.title = "Hello";
  win.appendChild(btn);
  btn.left = btn.top = 0;
  btn.width = 200;

  // wait a second for the window to show, the bounds will be 0 until the window is 
  // available, i suppose we should just use this after an event.
  setTimeout(function() { 
    /* The window bounds is actually the content view control embedded within the window */
    var wbb = win.bounds;
    var wbw = win.boundsOnWindow;
    $utils.assert(wbb.x == wbw.x, 'win.bounds.x['+wbb.x+'] != win.boundsOnWindow.x['+wbw.x+']');
    $utils.assert(wbb.y <= wbw.y, 'win.bounds.y['+wbb.y+'] != win.boundsOnWindow.y['+wbw.y+']');
    $utils.assert(wbb.width == wbw.width);
    $utils.assert(wbb.height == wbw.height);
    var wbs = win.boundsOnScreen; // = win.x, win.y, win.width, win.height
    $utils.assert(wbs.x >= win.x, 'win.boundsOnScreen.x['+wbs.x+'] != win.x['+win.x+']');
    $utils.assert(wbs.y >= win.y, 'win.boundsOnScreen.y['+wbs.y+'] != win.y['+win.y+']');
    $utils.assert(wbs.width <= win.width);
    $utils.assert(wbs.height <= win.height);


    var bbb = btn.bounds;
    $utils.assert(bbb.x <= wbb.x, 'btn.bounds.x['+bbb.x+'] != win.bounds.x['+wbb.x+']');
    $utils.assert(bbb.y == 0, 'btn.bounds.y['+bbb.y+'] != win.bounds.y['+wbb.y+']');
    $utils.assert(bbb.width == 200, 'bounds width does not equal 200: '+bbb.width);

    var bbw = btn.boundsOnWindow;
    $utils.assert(bbw.x == wbb.x);
    $utils.assert(bbw.y == wbw.y, 'btn.boundsOnWindow.y['+bbw.y+'] != win.boundsOnWindow.y['+wbb.y+']');
    var bbs = btn.boundsOnScreen;
    $utils.assert(bbs.x == wbs.x, 'btn.boundsOnScreen.x['+bbs.x+'] != win.boundsOnScreen.x['+wbs.x+']');
    $utils.assert(bbs.y == wbs.y, 'btn.boundsOnScreen.y['+bbs.y+'] != win.boundsOnScreen.y['+wbs.y+']');
    $utils.ok();
  },1000);
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