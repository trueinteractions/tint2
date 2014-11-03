
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
 * @see {ColorWell}
 * @example
 */
function run($utils) {
  var win = new Window();
  win.visible = true;
  var colorWell = new ColorWell();

  win.appendChild(colorWell);
  colorWell.color = new Color('rgba',255,0,0,1);
  colorWell.left = colorWell.top = 10;
  colorWell.width = 40;
  colorWell.height = 20;

  var myColor = colorWell.color;
  $utils.assert(myColor.red == 1, 'myColor.red:'+myColor.red);
  $utils.assert(myColor.green == 0, 'myColor.green:'+myColor.green);
  $utils.assert(myColor.blue == 0, 'myColor.blue:'+myColor.blue);
  $utils.assert(myColor.alpha == 1, 'myColor.alpha:'+myColor.alpha);
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
  name:"ColorWell",
};