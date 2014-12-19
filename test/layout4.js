
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
  var win = new Window();
  win.visible = true;
  var box = new Box();
  win.appendChild(box);
  box.left = box.right = box.top = box.bottom = 50;

  var text = new TextInput();
  text.value = "Centered/middle, 50px margin.";
  box.appendChild(text);
  text.middle = 0;
  text.center = 0;
  text.readonly = true;
  setTimeout(function() {
    var winBounds = win.bounds;
    var boxBounds = box.bounds;
    var textBounds = text.bounds;
    // Give the x/y values a leeway of 10 pixels in each direction
    // as the border frame (padding) differs from operating systems and
    // the styling of their native controls.
    $utils.assert(boxBounds.x > 45 && boxBounds.x < 51, 'Box bounds with a 50 margin, does not have a 50 px margin in x.');
    $utils.assert(textBounds.x > 99 && textBounds.x < 110, 'TextBox bounds has a x value either less than 99, or greater than 110.');
    $utils.assert(boxBounds.y > 45 && boxBounds.y < 51, 'Box bounds with a 50 margin, does not have a 50 px margin in y.');
    $utils.assert(textBounds.y > 165 && textBounds.y < 175, 'TextBox bounds has a y value either less than 165, or greater than 175.');
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
  name:"LayoutMiddleCenter",
};