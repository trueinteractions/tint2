
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
  var input = new TextInput();

  var mouseDown = false, mouseUp = false, rightMouseDown = false, mouseEnter = false, mouseExit = false, mouseMove = false;
  var mouseDown2 = false, mouseUp2 = false, rightMouseDown2 = false, mouseEnter2 = false, mouseExit2 = false, mouseMove2 = false;
  var inputEv = false, keyUp = false, keyDown = false;

  buttonNormal.title = "Hello";
  buttonNormal.addEventListener('mousedown', function() {
    mouseDown = true;
  });
  buttonNormal.addEventListener('mouseup', function() {
    mouseUp = true;
  });
  buttonNormal.addEventListener('rightmousedown', function() {
    rightMouseDown = true;
  });
  buttonNormal.addEventListener('rightmouseup', function() {
    rightMouseUp = true;
  });
  buttonNormal.addEventListener('mouseenter', function() {
    mouseEnter = true;
  });
  buttonNormal.addEventListener('mouseexit', function() {
    mouseExit = true;
  });
  buttonNormal.addEventListener('mousemove', function() {
    mouseMove = true;
  });


  input.addEventListener('mousedown', function() {
    mouseDown2 = true;
  });
  input.addEventListener('mouseup', function() {
    mouseUp2 = true;
  });
  input.addEventListener('rightmousedown', function() {
    //rightMouseDown2 = true;
  });
  input.addEventListener('rightmouseup', function() {
    //rightMouseUp2 = true;
  });
  input.addEventListener('mouseenter', function() {
    mouseEnter2 = true;
  });
  input.addEventListener('mouseexit', function() {
    mouseExit2 = true;
  });
  input.addEventListener('mousemove', function() {
    mouseMove2 = true;
  });
  input.addEventListener('input', function() {
    inputEv = true;
  });
  input.addEventListener('keydown', function() {
    keyDown = true;
  });
  input.addEventListener('keyup', function() {
    keyUp = true;
    /* @hidden */ $utils.assert(mouseDown == true);
    /* @hidden */ $utils.assert(mouseUp == true);
    /* @hidden */ //$utils.assert(rightMouseDown == true);
    /* @hidden */ $utils.assert(mouseEnter == true);
    /* @hidden */ $utils.assert(mouseExit == true);
    /* @hidden */ $utils.assert(mouseMove == true);
    /* @hidden */ $utils.assert(mouseDown2 == true);
    /* @hidden */ $utils.assert(mouseUp2 == true);
    /* @hidden */ //$utils.assert(rightMouseDown2 == true); //TODO: find out why utils cannot mimick a right mouse down properly.
    /* @hidden */ $utils.assert(mouseEnter2  == true);
    /* @hidden */ $utils.assert(mouseExit2 == true);
    /* @hidden */ $utils.assert(mouseMove2 == true);
    /* @hidden */ $utils.assert(inputEv == true);
    /* @hidden */ $utils.assert(keyUp == true);
    /* @hidden */ $utils.assert(keyDown == true);
    /* @hidden */ $utils.ok();

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
  

  setTimeout(function() { $utils.clickAtControl(buttonNormal); }, 1000);
  setTimeout(function() { $utils.clickAtControl(input); }, 2000);
  setTimeout(function() { $utils.clickAtControl(buttonNormal); }, 3000);
  setTimeout(function() { $utils.clickAtControl(input); }, 4000);
  setTimeout(function() { $utils.keyAtControl('a'); }, 5000);

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
  name:"Events",
};