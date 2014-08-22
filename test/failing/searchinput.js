
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.SearchInput = require('SearchInput');
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  var input = new SearchInput();
  var input2 = new SearchInput();

  mainWindow.appendChild(input);
  mainWindow.appendChild(input2);

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
    firstItem:input2, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:0.0, constant:55.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input2, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:0.0, constant:85.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input2, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input2, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });

  /* @hidden */ var inputStart = false;
  /* @hidden */ var inputEnd = false;
  /* @hidden */ var inputEv = false;
  input.addEventListener('input', function(e) {
    /* @hidden */ inputEv = true; 
  });
  input.addEventListener('inputstart', function(e) { 
    /* @hidden */ inputStart = true; 
  });
  input.addEventListener('inputend', function(e) { 
    /* @hidden */ //$utils.ok();
  });
  input.addEventListener('mouseDown', function(e) { 
    /* @hidden */ $utils.keyAtControl('a'); 
  });
  input.addEventListener('mouseMoved', function(e) { 
  });
  input.addEventListener('keyUp', function(e) {
    /* @hidden */ //$utils.assert(inputStart);
    /* @hidden */ //$utils.assert(inputEv);
    console.log('input.value ', input.value);
    /* @hidden */ $utils.assert(input.value == 'a');
    /* @hidden */ $utils.ok();
    /* @hidden */ //$utils.clickAtControl(input2);
  });
  /* @hidden */ input.addEventListener('keyDown', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseUp', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('rightMouseDown', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('rightMouseUp', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseEntered', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseExited', function(e) { }); // doesn't work

  /* @hidden */ setTimeout(function() { $utils.clickAtControl(input); }, 500);
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
  name:"SearchInput",
};