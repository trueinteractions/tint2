
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
 * @see {ImageWell}
 * @example
 */
function run($utils) {
  //TODO: Add more thorough unit tests for this.
  var win = new Window();
  win.visible = true;
  var imageWell = new ImageWell();

  win.appendChild(imageWell);
  imageWell.left = imageWell.top = 0;
  imageWell.width = '100%';
  imageWell.height = '100%';
  imageWell.image = "app:///assets/tintcompiler.png";
  $utils.assert(imageWell.animates == false);
  $utils.assert(imageWell.scale == "constrain");
  $utils.assert(imageWell.image == "app:///assets/tintcompiler.png");
  $utils.assert(imageWell.alignment == "center");
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
  name:"ImageWell",
};