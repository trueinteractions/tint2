
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
  var TextInput = require('TextInput');

  var win = new Window();
  win.visible = true;
  var box = new Box();
  box.borderWidth = 2;
  box.borderColor = 'red';
  box.backgroundColor = 'rgba(0,255,0,1)';
  box.borderRadius = 13;
  win.appendChild(box);
  box.left = box.right = box.top = box.bottom = 50;

  var text = new TextInput();
  text.value = "Visual check: lime green bg, 2px red border, 13px corner radius.";
  box.appendChild(text);
  text.middle = 0;
  text.center = 0;
  text.width = 300;
  text.readonly = true;
  setTimeout(function() {

    var bgColor = box.backgroundColor;
    $utils.assert(bgColor.alpha === 1);
    $utils.assert(bgColor.red === 0);
    $utils.assert(bgColor.blue === 0);
    $utils.assert(bgColor.green === 1);

    var borderColor = box.borderColor;
    $utils.assert(borderColor.alpha === 1);
    $utils.assert(borderColor.red === 1);
    $utils.assert(borderColor.blue === 0);
    $utils.assert(borderColor.green === 0);

    $utils.assert(box.borderRadius == 13);
    $utils.assert(box.borderWidth == 2);

    $utils.ok();
  },2000);
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