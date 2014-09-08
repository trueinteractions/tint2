
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
  var colorWell = new ColorWell();

  win.appendChild(colorWell);
  colorWell.color = new Color('rgba',1,0,0,1);
  colorWell.left = colorWell.top = 10;
  colorWell.width = 40;
  colorWell.height = 20;

  var myColor = colorWell.color;
  $utils.assert(myColor.red == 1);
  $utils.assert(myColor.green == 0);
  $utils.assert(myColor.blue == 0);
  $utils.assert(myColor.alpha == 1);
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