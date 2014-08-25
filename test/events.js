
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.Button = require('Button');
  global.TextInput = require('TextInput');
  global.SelectInput = require('SelectInput');
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
  /* @hidden */ count = 0;
  var mainWindow = new Window();
  var buttonNormal = new Button();
  var input = new SelectInput();
  buttonNormal.title = "Hello";
  buttonNormal.addEventListener('mousedown', function() {
    console.log('mousedown');
  });
  buttonNormal.addEventListener('mouseup', function() {
    console.log('mouseup');
  });
  buttonNormal.addEventListener('rightmousedown', function() {
    console.log('rightmousedown');
  });
  buttonNormal.addEventListener('rightmouseup', function() {
    console.log('rightmouseup');
  });
  buttonNormal.addEventListener('mouseenter', function() {
    console.log('mouseenter');
  });
  buttonNormal.addEventListener('mouseexit', function() {
    console.log('mouseexit');
  });
  //buttonNormal.addEventListener('mousemove', function() {
  //  console.log('mousemove' + (count++));
  //});


  input.addEventListener('mousedown', function() {
    console.log('input mousedown');
  });
  input.addEventListener('mouseup', function() {
    console.log('input mouseup');
  });
  input.addEventListener('rightmousedown', function() {
    console.log('input rightmousedown');
  });
  input.addEventListener('rightmouseup', function() {
    console.log('input rightmouseup');
  });
  input.addEventListener('mouseenter', function() {
    console.log('input mouseenter');
  });
  input.addEventListener('mouseexit', function() {
    console.log('input mouseexit');
  });
  //input.addEventListener('mousemove', function() {
  //  console.log('input mousemove' + (count++));
  //});
  input.addEventListener('input', function() {
    console.log('input');
  });
  input.addEventListener('keyup', function() {
    console.log('keyup');
  });
  input.addEventListener('keydown', function() {
    console.log('keydown');
  });

  mainWindow.appendChild(buttonNormal);
  mainWindow.appendChild(input);

  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:0.0, constant:35.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });

  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:buttonNormal, firstAttribute:'top',
    secondItem:input, secondAttribute:'bottom',
    multiplier:0.0, constant:60.0
  });
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
  name:"Buttons",
};