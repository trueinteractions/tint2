
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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new TextInput();
  var input2 = new TextInput();

  mainWindow.appendChild(input);
  mainWindow.appendChild(input2);

  input.top = 10;
  input.height = 25;
  input.left = 10;
  input.right = 10;
  input2.top = 55;
  input2.left = 10;
  input2.right = 10;
  input2.height = 25;

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
    /* @hidden */ $utils.ok();
  });
  input.addEventListener('mousedown', function(e) { 
    /* @hidden */ $utils.keyAtControl('a'); 
  });
  input.addEventListener('mousemove', function(e) { 
  });
  input.addEventListener('keyup', function(e) {
    /* @hidden */ $utils.assert(inputStart);
    /* @hidden */ $utils.assert(inputEv);
    /* @hidden */ $utils.assert(input.value == 'a');
    /* @hidden */ $utils.clickAtControl(input2);
  });
  /* @hidden */ input.addEventListener('keydown', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseup', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('rightmousedown', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('rightmouseup', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseenter', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseexit', function(e) { }); // doesn't work

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
  name:"TextInput",
};